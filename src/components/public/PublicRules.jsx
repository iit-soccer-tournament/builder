import React from 'react';

function PublicRules({ rulesText = '' }) {
  return (
    <div className="card text-left">
      <div className="card-header">
        <h2>Tournament Rules &amp; Regulations</h2>
      </div>
      <div className="card-body">
        <div className="rules-content">
          {rulesText.split('\n').map((line, idx) => {
            if (line.startsWith('### ')) {
              return <h3 key={idx} className="rules-h3">{line.replace('### ', '')}</h3>;
            }
            if (line.startsWith('#### ')) {
              return <h4 key={idx} className="rules-h4">{line.replace('#### ', '')}</h4>;
            }
            if (line.startsWith('* ')) {
              return <li key={idx} className="rules-li">{line.replace('* ', '')}</li>;
            }
            if (line.trim() === '') {
              return <br key={idx} />;
            }
            return <p key={idx} className="rules-p">{line}</p>;
          })}
        </div>
      </div>
    </div>
  );
}

export default PublicRules;
