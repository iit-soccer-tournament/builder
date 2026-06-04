import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// 1. Load env variables
function loadEnv() {
  const env = {};
  let envPath = path.resolve('.env');
  if (!fs.existsSync(envPath)) {
    envPath = path.resolve('builder/.env');
  }
  if (!fs.existsSync(envPath)) {
    console.error('No .env file found!');
    return env;
  }
  
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const index = trimmed.indexOf('=');
    if (index !== -1) {
      const key = trimmed.substring(0, index).trim();
      const val = trimmed.substring(index + 1).trim();
      env[key] = val;
    }
  });
  return env;
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node seed_supabase_all.js <admin_email> <admin_password>');
  process.exit(1);
}

const [email, password] = args;

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing from .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to convert base64 to Buffer
function base64ToBuffer(base64Data) {
  return Buffer.from(base64Data, 'base64');
}

async function uploadImage(base64Str, filename) {
  try {
    const parts = base64Str.split(',');
    const mime = parts[0].match(/:(.*?);/)[1];
    const base64Data = parts[1];
    const buffer = base64ToBuffer(base64Data);
    
    console.log(`Uploading ${filename} (${mime})...`);
    
    const { data, error } = await supabase.storage
      .from('tournament-images')
      .upload(`images/${filename}`, buffer, {
        contentType: mime,
        cacheControl: '3600',
        upsert: true // Set to true to overwrite duplicates. (Requires SELECT policy in Supabase)
      });
      
    if (error) {
      throw error;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('tournament-images')
      .getPublicUrl(`images/${filename}`);
      
    return publicUrl;
  } catch (err) {
    console.error(`Error uploading ${filename}:`, err);
    throw err;
  }
}

async function main() {
  console.log(`Attempting login for ${email}...`);
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authErr) {
    console.error('Login failed:', authErr.message);
    process.exit(1);
  }

  console.log('Login successful! Authenticated as:', authData.user.email);

  console.log('Reading database_fallback.json...');
  const fallbackPath = path.resolve('src/data/database_fallback.json');
  if (!fs.existsSync(fallbackPath)) {
    console.error(`Fallback file not found at ${fallbackPath}`);
    process.exit(1);
  }
  
  const fallback = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
  const editions = fallback.editions || {};
  const palmaresOverview = fallback.palmaresOverview || [];
  
  // Track uploaded champion photo public URLs to link them in palmares_overview
  const champPhotoUrls = {};
  
  // User's specific 2013 photo URL uploaded manually
  const user2013PhotoUrl = "https://cmsaiicrttiihtcbbgxt.supabase.co/storage/v1/object/public/tournament-images/images/1780594551509_trophy_champ_2013.jpeg";
  champPhotoUrls['2013'] = user2013PhotoUrl;

  const years = Object.keys(editions).sort();
  console.log(`Found seasons to seed: ${years.join(', ')}`);
  
  for (const yr of years) {
    const ed = editions[yr];
    console.log(`\n--- Processing Season ${yr} ---`);
    
    // Check if season already exists in DB
    const { data: existingSeason } = await supabase
      .from('tournament_seasons')
      .select('year')
      .eq('year', parseInt(yr, 10))
      .single();
      
    if (existingSeason && (yr === '2025' || yr === '2026')) {
      console.log(`Season ${yr} already exists in DB. Skipping to preserve updates for active years.`);
      continue;
    }
    
    if (ed.customTrophies && ed.customTrophies.length > 0) {
      const updatedTrophies = [];
      for (const t of ed.customTrophies) {
        const trophyCopy = { ...t };
        
        // If it's 2013 and it's the champion photo, link the user's manual URL directly
        if (yr === '2013' && (trophyCopy.id === 'champ_2013' || trophyCopy.name === "Champion Team Photo")) {
          console.log(`Linking 2013 champion photo to user's URL: ${user2013PhotoUrl}`);
          trophyCopy.imageData = user2013PhotoUrl;
          trophyCopy.imagePath = user2013PhotoUrl;
        } else if (trophyCopy.imageData && trophyCopy.imageData.startsWith('data:')) {
          try {
            const parts = trophyCopy.imageData.split(',');
            const mime = parts[0].match(/:(.*?);/)[1];
            const ext = mime.split('/')[1] || 'png';
            // Use deterministic filename to prevent duplicates
            const filename = `trophy_${yr}_${trophyCopy.id}.${ext}`;
            
            const publicUrl = await uploadImage(trophyCopy.imageData, filename);
            console.log(`Successfully uploaded. Public URL: ${publicUrl}`);
            
            trophyCopy.imageData = publicUrl;
            trophyCopy.imagePath = publicUrl;
            
            if (trophyCopy.id === `champ_${yr}` || trophyCopy.name === "Champion Team Photo") {
              champPhotoUrls[yr] = publicUrl;
            }
          } catch (uploadErr) {
            console.error(`Failed to process trophy image for ${yr}:`, uploadErr);
          }
        }
        updatedTrophies.push(trophyCopy);
      }
      ed.customTrophies = updatedTrophies;
    }
    
    // Upsert to tournament_seasons
    console.log(`Saving Season ${yr} details to database...`);
    const { error: upsertErr } = await supabase
      .from('tournament_seasons')
      .upsert({
        year: parseInt(yr, 10),
        data: ed
      });
      
    if (upsertErr) {
      console.error(`Error saving season ${yr}:`, upsertErr);
    } else {
      console.log(`Season ${yr} successfully saved.`);
    }
  }
  
  // 3. Update global tournament_data
  console.log('\n--- Updating Global Tournament Data ---');
  const { data: globalData, error: globalErr } = await supabase
    .from('tournament_data')
    .select('*')
    .eq('id', 'global')
    .single();
    
  if (globalErr && globalErr.code !== 'PGRST116') {
    console.error('Error fetching global tournament data:', globalErr);
    process.exit(1);
  }
  
  const currentGlobal = globalData || {
    id: 'global',
    active_edition_year: 2026,
    palmares_overview: [],
    global_rules: fallback.globalRules || "",
    global_field_info: fallback.globalFieldInfo || {},
    seasons_list: {}
  };
  
  // Update seasons_list
  const updatedSeasonsList = currentGlobal.seasons_list || {};
  years.forEach(yr => {
    const ed = editions[yr];
    if (!updatedSeasonsList[yr]) {
      updatedSeasonsList[yr] = {
        year: ed.year,
        isFinished: ed.isFinished || false,
        champion: ed.champion || '',
        runnerUp: ed.runnerUp || '',
        drunkChampion: ed.drunkChampion || '',
        topScorerM: ed.topScorerM || '',
        topScorerW: ed.topScorerW || ''
      };
    }
  });
  
  // Update palmares_overview to map old relative image paths to Supabase public URLs
  const updatedPalmaresOverview = currentGlobal.palmares_overview || [];
  
  if (updatedPalmaresOverview.length === 0) {
    palmaresOverview.forEach(p => {
      const pCopy = { ...p };
      if (champPhotoUrls[pCopy.year]) {
        pCopy.championPhoto = champPhotoUrls[pCopy.year];
      } else {
        pCopy.championPhoto = null;
      }
      updatedPalmaresOverview.push(pCopy);
    });
  } else {
    updatedPalmaresOverview.forEach(p => {
      if (champPhotoUrls[p.year]) {
        console.log(`Updating Palmares ${p.year} championPhoto to: ${champPhotoUrls[p.year]}`);
        p.championPhoto = champPhotoUrls[p.year];
      }
    });
  }
  
  console.log('Saving global tournament data...');
  const { error: saveGlobalErr } = await supabase
    .from('tournament_data')
    .upsert({
      id: 'global',
      active_edition_year: currentGlobal.active_edition_year || 2026,
      palmares_overview: updatedPalmaresOverview,
      global_rules: currentGlobal.global_rules,
      global_field_info: currentGlobal.global_field_info,
      seasons_list: updatedSeasonsList
    });
    
  if (saveGlobalErr) {
    console.error('Error saving global data:', saveGlobalErr);
  } else {
    console.log('Global data successfully saved!');
  }
  
  console.log('\n--- Seeding Process Completed Successfully! ---');
}

main();
