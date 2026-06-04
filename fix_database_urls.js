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
  console.error('Usage: node fix_database_urls.js <admin_email> <admin_password>');
  process.exit(1);
}

const [email, password] = args;
const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log(`Logging in as ${email}...`);
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authErr) {
    console.error('Login failed:', authErr.message);
    process.exit(1);
  }

  console.log('Login successful! Listing files in storage bucket...');
  const { data: files, error: listErr } = await supabase.storage
    .from('tournament-images')
    .list('images', { limit: 100 });

  if (listErr) {
    console.error('Failed to list files:', listErr.message);
    process.exit(1);
  }

  console.log(`Found ${files.length} files in bucket.`);
  
  // Find correct filenames in the bucket for 2013 and 2022
  const fileNames = files.map(f => f.name);
  console.log('Available files:', fileNames);

  // Helper to find any file in the bucket that contains a keyword
  const findFile = (year, defaultFallback) => {
    // Try to find a file containing the year and "champ" or "trophy"
    const match = fileNames.find(name => name.includes(year) && (name.includes('champ') || name.includes('trophy')));
    if (match) {
      return `${supabaseUrl}/storage/v1/object/public/tournament-images/images/${match}`;
    }
    return defaultFallback;
  };

  // 1. Update seasons detailed docs in database
  const { data: seasons, error: seasonsErr } = await supabase
    .from('tournament_seasons')
    .select('*');

  if (seasonsErr) {
    console.error('Failed to fetch seasons:', seasonsErr.message);
    process.exit(1);
  }

  for (const s of seasons) {
    let modified = false;
    const data = s.data;
    if (data.customTrophies) {
      data.customTrophies.forEach(t => {
        if (t.id === `champ_${s.year}` || t.name === 'Champion Team Photo') {
          const currentUrl = t.imagePath;
          const correctedUrl = findFile(s.year.toString(), currentUrl);
          if (correctedUrl !== currentUrl) {
            console.log(`Year ${s.year}: Correcting customTrophies URL from ${currentUrl} -> ${correctedUrl}`);
            t.imagePath = correctedUrl;
            t.imageData = correctedUrl;
            modified = true;
          }
        }
      });
    }

    if (modified) {
      const { error: updateErr } = await supabase
        .from('tournament_seasons')
        .upsert({ year: s.year, data });

      if (updateErr) {
        console.error(`Failed to update season ${s.year}:`, updateErr.message);
      } else {
        console.log(`Season ${s.year} successfully updated in database!`);
      }
    }
  }

  // 2. Update global tournament_data palmares overview
  const { data: globalData, error: globalErr } = await supabase
    .from('tournament_data')
    .select('*')
    .eq('id', 'global')
    .single();

  if (globalErr) {
    console.error('Failed to fetch global tournament data:', globalErr.message);
    process.exit(1);
  }

  if (globalData) {
    let modified = false;
    const palmares = globalData.palmares_overview || [];
    palmares.forEach(p => {
      const currentUrl = p.championPhoto;
      if (currentUrl) {
        const correctedUrl = findFile(p.year.toString(), currentUrl);
        if (correctedUrl !== currentUrl) {
          console.log(`Global: Correcting Palmares ${p.year} championPhoto URL from ${currentUrl} -> ${correctedUrl}`);
          p.championPhoto = correctedUrl;
          modified = true;
        }
      }
    });

    if (modified) {
      const { error: globalUpdateErr } = await supabase
        .from('tournament_data')
        .upsert({
          ...globalData,
          palmares_overview: palmares
        });

      if (globalUpdateErr) {
        console.error('Failed to update global tournament data:', globalUpdateErr.message);
      } else {
        console.log('Global tournament_data successfully updated!');
      }
    }
  }
}

main();
