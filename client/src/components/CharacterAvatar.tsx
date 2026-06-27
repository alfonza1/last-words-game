import type { CharacterLoadout } from '../types';
import { OUTFIT_PALETTES, hairColor, lipColorForSkinTone, skinColor } from '../data/cosmetics';

interface Props {
  character: CharacterLoadout;
  className?: string;
  armed?: boolean;
}

export function CharacterAvatar({ character, className = '', armed = false }: Props) {
  const skin = skinColor(character.skinTone);
  const hair = hairColor(character.hairColor);
  const lips = lipColorForSkinTone(character.skinTone);
  const outfit = OUTFIT_PALETTES[character.outfit] ?? OUTFIT_PALETTES['outfit-field'];
  const glow = outfit.glow ?? outfit.trim;

  return (
    <svg
      viewBox="0 0 220 280"
      role="img"
      aria-label="Equipped survivor"
      className={className}
      style={{ filter: `drop-shadow(0 0 14px ${glow}33)` }}
    >
      <defs>
        <radialGradient id="avatar-ground" cx="50%" cy="50%">
          <stop offset="0" stopColor={glow} stopOpacity=".3" />
          <stop offset="1" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="avatar-coat" x1="0" x2="1">
          <stop offset="0" stopColor={outfit.primary} />
          <stop offset=".55" stopColor={outfit.secondary} />
          <stop offset="1" stopColor="#050708" />
        </linearGradient>
      </defs>

      <ellipse cx="110" cy="260" rx="76" ry="17" fill="url(#avatar-ground)" />
      <ellipse cx="110" cy="255" rx="52" ry="9" fill="rgba(0,0,0,.48)" />

      {/* Boots + legs */}
      <path d="M82 190 L105 190 L102 245 L74 245 Z" fill="#111719" stroke={outfit.trim} strokeOpacity=".35" />
      <path d="M115 190 L138 190 L147 245 L119 245 Z" fill="#111719" stroke={outfit.trim} strokeOpacity=".35" />
      <path d="M68 242 H104 V255 H62 Q59 248 68 242Z" fill="#080b0d" />
      <path d="M118 242 H151 Q160 248 154 255 H118Z" fill="#080b0d" />

      {/* Coat silhouette */}
      <path
        d="M78 104 Q110 90 142 104 L151 194 Q131 207 110 200 Q89 207 69 194Z"
        fill="url(#avatar-coat)"
        stroke={outfit.trim}
        strokeWidth="2"
      />
      {character.outfit === 'outfit-warden' && (
        <path d="M72 153 L58 227 L94 207 L110 176 L126 207 L162 227 L148 153Z" fill={outfit.primary} opacity=".9" />
      )}
      {character.outfit === 'outfit-raider' && (
        <>
          <path d="M70 119 L91 101 L100 129 L78 138Z" fill="#504d48" stroke="#ffb300" />
          <path d="M150 119 L129 101 L120 129 L142 138Z" fill="#504d48" stroke="#ffb300" />
        </>
      )}
      {character.outfit === 'outfit-neon' && (
        <>
          <path d="M82 111 L99 144 L91 190" fill="none" stroke="#00f0ff" strokeWidth="3" />
          <path d="M138 111 L121 144 L130 190" fill="none" stroke="#ff2bd6" strokeWidth="3" />
        </>
      )}
      {character.outfit === 'outfit-inferno' && (
        <>
          <path d="M80 121 L94 110 L110 135 L126 110 L140 121" fill="none" stroke="#ff3b12" strokeWidth="4" />
          <circle cx="110" cy="155" r="9" fill="#080101" stroke="#ff3b12" strokeWidth="3" />
        </>
      )}
      {character.outfit === 'outfit-godmode-revenant' && (
        <>
          {/* Split-tail admin longcoat — distinct silhouette below the hem */}
          <path d="M92 188 L78 244 L104 224 L110 200 Z" fill="#07070d" stroke="#f8d66d" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M128 188 L142 244 L116 224 L110 200 Z" fill="#0b0c16" stroke="#f8d66d" strokeWidth="1.6" strokeLinejoin="round" />
          <path d="M104 224 L110 206 L116 224" fill="none" stroke="#00f0ff" strokeWidth="1.4" opacity=".7" />
          {/* Cyan-lit armored boots */}
          <path d="M70 247 H102 M120 247 H150" stroke="#00f0ff" strokeWidth="2" strokeLinecap="round" opacity=".6" />
          {/* Subtle preview-only glitch aura */}
          <g opacity=".55">
            <rect x="70" y="132" width="16" height="3" fill="#00f0ff" opacity=".4" />
            <rect x="136" y="150" width="14" height="3" fill="#ff174d" opacity=".4" />
          </g>
          {/* High collar flaps framing the neck */}
          <path d="M92 113 L100 91 L108 104 M128 113 L120 91 L112 104" fill="none" stroke="#f8d66d" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          {/* Asymmetrical shoulder armor — heavy on the left */}
          <path d="M68 116 L92 103 L98 122 L72 130 Z" fill="#1b2433" stroke="#f8d66d" strokeWidth="2" />
          <path d="M150 112 L136 106 L132 119 L146 124 Z" fill="#1b2433" stroke="#f8d66d" strokeWidth="1.5" opacity=".85" />
          {/* Glowing command-core chest emblem */}
          <g style={{ filter: 'drop-shadow(0 0 6px #00f0ff)' }}>
            <path d="M110 128 L121 135 L121 148 L110 155 L99 148 L99 135 Z" fill="#04141b" stroke="#00f0ff" strokeWidth="2.5" />
            <path d="M106 138 L103 138 L103 145 L106 145 M114 138 L117 138 L117 145 L114 145" fill="none" stroke="#00f0ff" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="110" cy="141" r="2.2" fill="#00f0ff" />
          </g>
          {/* Terminal / debug seam lines */}
          <path d="M96 159 V191 M124 159 V191" stroke="#00f0ff" strokeWidth="1.2" strokeDasharray="3 4" opacity=".7" />
          <path d="M100 166 h7 M100 173 h4 M100 180 h8" stroke="#00f0ff" strokeWidth="1" strokeLinecap="round" opacity=".5" />
          {/* Red corrupted override slashes */}
          <path d="M84 150 L101 169 M127 142 L143 161 M91 178 L104 192" stroke="#ff174d" strokeWidth="3" strokeLinecap="round" opacity=".9" />
        </>
      )}
      {character.outfit === 'outfit-neon-plague-saint' && (
        <>
          {/* Flared sealed plague robe — covers the legs for a robed silhouette */}
          <path d="M86 150 L60 250 L160 250 L134 150 Q110 164 86 150 Z" fill="url(#avatar-coat)" stroke="#9dff4f" strokeWidth="2" />
          <path d="M110 158 V248" stroke="#9dff4f" strokeOpacity=".45" strokeWidth="1.4" />
          {/* Pointed plague-saint hood framing the head */}
          <path d="M80 66 Q75 30 110 24 Q145 30 140 66 L131 58 Q110 42 89 58 Z" fill={outfit.secondary} stroke="#9dff4f" strokeWidth="2" />
          {/* Glowing toxic seams running down the robe */}
          <path d="M96 120 Q92 185 82 244 M124 120 Q128 185 138 244" fill="none" stroke="#00ff99" strokeWidth="2" opacity=".8" style={{ filter: 'drop-shadow(0 0 4px #00ff99)' }} />
          {/* Preview-only toxic mist aura */}
          <g fill="#39ff14">
            <circle cx="74" cy="150" r="2.2" opacity=".5" />
            <circle cx="146" cy="140" r="2.4" opacity=".45" />
            <circle cx="70" cy="186" r="1.6" opacity=".4" />
          </g>
          {/* Sealed saint collar */}
          <path d="M90 112 Q110 95 130 112 L126 122 Q110 107 94 122 Z" fill={outfit.secondary} stroke="#9dff4f" strokeWidth="2" />
          {/* Chest plague-core vial */}
          <g style={{ filter: 'drop-shadow(0 0 6px #39ff14)' }}>
            <rect x="102" y="127" width="16" height="24" rx="6" fill="#04140b" stroke="#9dff4f" strokeWidth="2" />
            <rect x="106" y="136" width="8" height="11" rx="3" fill="#39ff14" opacity=".92" />
            <path d="M105 132 H115" stroke="#9dff4f" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="110" cy="141" r="1.7" fill="#f8ffe8" />
          </g>
          {/* Neon holy sigil — cross within a ring, on the robe */}
          <g fill="none" stroke="#9dff4f" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 4px #39ff14)' }}>
            <circle cx="110" cy="180" r="9" />
            <path d="M110 173 V187 M103 180 H117" strokeLinecap="round" />
          </g>
          {/* Sealed robe panels */}
          <path d="M84 206 H100 M120 206 H136" stroke="#9dff4f" strokeWidth="1.4" strokeDasharray="4 3" opacity=".7" />
        </>
      )}

      {/* Arms */}
      <path d="M77 116 Q54 136 64 174" fill="none" stroke={outfit.primary} strokeWidth="19" strokeLinecap="round" />
      <path d="M143 116 Q165 136 154 174" fill="none" stroke={outfit.primary} strokeWidth="19" strokeLinecap="round" />
      <circle cx="64" cy="176" r="8" fill={skin} />
      <circle cx="154" cy="176" r="8" fill={skin} />

      {/* Outfit-specific hands drawn over the bare skin */}
      {character.outfit === 'outfit-godmode-revenant' && (
        <g stroke="#f8d66d" strokeWidth="1.3">
          <path d="M56 167 L73 167 L70 185 L59 185 Z" fill="#111827" />
          <path d="M147 167 L164 167 L161 185 L150 185 Z" fill="#111827" />
          <circle cx="64" cy="176" r="2.6" fill="#00f0ff" stroke="none" style={{ filter: 'drop-shadow(0 0 4px #00f0ff)' }} />
          <circle cx="154" cy="176" r="2.6" fill="#00f0ff" stroke="none" style={{ filter: 'drop-shadow(0 0 4px #00f0ff)' }} />
        </g>
      )}
      {character.outfit === 'outfit-neon-plague-saint' && (
        <g stroke="#9dff4f" strokeWidth="1.3">
          <path d="M56 168 Q64 164 72 168 L70 185 L58 185 Z" fill="#0d1a10" />
          <path d="M148 168 Q156 164 164 168 L162 185 L150 185 Z" fill="#0d1a10" />
          <circle cx="64" cy="177" r="2.4" fill="#39ff14" stroke="none" style={{ filter: 'drop-shadow(0 0 4px #39ff14)' }} />
          <circle cx="154" cy="177" r="2.4" fill="#39ff14" stroke="none" style={{ filter: 'drop-shadow(0 0 4px #39ff14)' }} />
        </g>
      )}

      {/* Neck + head */}
      <rect x="100" y="83" width="20" height="24" rx="8" fill={skin} />
      <ellipse cx="110" cy="66" rx="32" ry="37" fill={skin} />
      <path d="M83 63 Q110 47 137 63 L134 85 Q110 100 86 84Z" fill="rgba(0,0,0,.08)" />
      <Face expression={character.expression} glow={glow} lips={lips} />

      <Hair style={character.hair} color={hair} accent={glow} />
      <Accessory type={character.accessory} glow={glow} />

      {/* Outfit details */}
      <path d="M110 105 V194" stroke={outfit.trim} strokeOpacity=".75" strokeWidth="3" />
      <path d="M82 170 H100 V183 H82Z M120 170 H138 V183 H120Z" fill={outfit.secondary} stroke={outfit.trim} strokeOpacity=".45" />
      <circle cx="110" cy="121" r="4" fill={glow} opacity=".9" />

      {armed && (
        <g transform="translate(52 151) rotate(-8)">
          <rect x="0" y="0" width="94" height="9" rx="3" fill="#151b1e" stroke="#708086" />
          <rect x="64" y="-3" width="39" height="4" fill="#080b0d" />
          <path d="M29 8 L42 8 L37 28 L28 28Z" fill="#0a0d0f" />
          <rect x="13" y="-4" width="24" height="5" rx="2" fill={outfit.trim} opacity=".8" />
        </g>
      )}
    </svg>
  );
}

function Face({ expression, glow, lips }: { expression: string; glow: string; lips: string }) {
  const ink = '#101416';

  if (expression === 'grave-grin') {
    return (
      <g>
        <path d="M91 61 Q99 56 106 61 M116 62 Q122 56 130 58" fill="none" stroke={ink} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M95 68 Q100 65.5 105 68" fill="none" stroke={ink} strokeWidth="2.4" strokeLinecap="round" opacity=".65" />
        <path d="M117 69 Q123 68 128 69" fill="none" stroke={lips} strokeWidth="1.65" strokeLinecap="round" opacity=".8" />
        <circle cx="101" cy="68" r="2.25" fill={ink} />
        <path d="M120 57 L123 67 L121 78" fill="none" stroke="#5e1f1a" strokeWidth="2.35" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M120.35 57.5 L122.45 67 L120.85 77.4" fill="none" stroke="#d08a78" strokeWidth=".78" strokeLinecap="round" strokeLinejoin="round" opacity=".78" />
        <path d="M118.5 62 L121.5 60 M121.5 73 L125 75" fill="none" stroke="#5e1f1a" strokeWidth=".8" strokeLinecap="round" opacity=".42" />
        <path d="M117 69 Q123 67.5 129 69" fill="none" stroke={lips} strokeWidth="1.5" strokeLinecap="round" opacity=".9" />
        <path d="M99 84 Q108 86 116 84 Q122 82 125 79" fill="none" stroke={lips} strokeWidth="2.45" strokeLinecap="round" />
        <path d="M102 86 Q112 88 121 82" fill="none" stroke="#f1d8cb" strokeWidth="1.05" strokeLinecap="round" opacity=".42" />
        <path d="M124 79 Q127 78 129 76.5" fill="none" stroke={lips} strokeWidth=".95" strokeLinecap="round" opacity=".62" />
      </g>
    );
  }

  if (expression === 'dead-calm') {
    return (
      <g>
        <path d="M94 67 H104 M116 67 H126" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M101 84 H119" stroke={lips} strokeWidth="2.2" strokeLinecap="round" />
      </g>
    );
  }

  if (expression === 'haunted') {
    return (
      <g>
        <path d="M93 60 Q99 55 105 60 M115 60 Q121 55 127 60" fill="none" stroke={ink} strokeOpacity=".65" strokeWidth="2" />
        <circle cx="99" cy="68" r="5" fill="#e8ece6" stroke={ink} strokeWidth="1.5" />
        <circle cx="121" cy="68" r="5" fill="#e8ece6" stroke={ink} strokeWidth="1.5" />
        <circle cx="100" cy="69" r="2.2" fill={ink} />
        <circle cx="120" cy="69" r="2.2" fill={ink} />
        <path d="M102 86 Q110 80 118 86" fill="none" stroke={lips} strokeWidth="2.2" strokeLinecap="round" />
      </g>
    );
  }

  if (expression === 'blood-rush') {
    return (
      <g>
        <path d="M92 60 L104 65 M128 60 L116 65" stroke={ink} strokeWidth="3" strokeLinecap="round" />
        <circle cx="99" cy="69" r="3" fill={ink} />
        <circle cx="121" cy="69" r="3" fill={ink} />
        <path d="M99 84 Q109 78 121 82" fill="none" stroke={lips} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M102 84 Q110 81 118 83 L116 87 Q109 88 103 87Z" fill="#f4ded2" stroke={lips} strokeWidth="1" />
        <path d="M106 83 L106 87 M110 82 L110 88 M114 82 L114 87" stroke={lips} strokeOpacity=".65" strokeWidth=".9" />
        <path d="M102 89 Q111 91 120 86" fill="none" stroke={lips} strokeWidth="1.8" strokeLinecap="round" />
      </g>
    );
  }

  if (expression === 'not-yet-dead') {
    return (
      <g>
        <path d="M91 61 L105 58 M116 58 L130 61" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="99" cy="68" r="3" fill={ink} />
        <circle cx="121" cy="68" r="7" fill={glow} opacity=".18" style={{ filter: `drop-shadow(0 0 7px ${glow})` }} />
        <circle cx="121" cy="68" r="4.2" fill="#101416" stroke={glow} strokeWidth="1.8" />
        <circle cx="121" cy="68" r="1.9" fill={glow} />
        <path d="M116 66 L126 70 M121 62 L121 74" stroke={glow} strokeWidth=".9" strokeLinecap="round" opacity=".7" />
        <path d="M101 84 Q111 91 123 80" fill="none" stroke={lips} strokeWidth="2.35" strokeLinecap="round" />
        <path d="M123 80 Q126 78.5 129 76.5" fill="none" stroke={lips} strokeWidth="1" strokeLinecap="round" opacity=".65" />
        <path d="M129 68 L136 70 M127 74 L133 80 M126 63 L132 59" stroke={glow} strokeOpacity=".6" strokeWidth="1.45" strokeLinecap="round" />
      </g>
    );
  }

  return (
    <g>
      <path d="M94 63 Q99 61 104 63 M116 63 Q121 61 126 63" fill="none" stroke={ink} strokeWidth="2" strokeLinecap="round" />
      <circle cx="99" cy="68" r="3" fill={ink} />
      <circle cx="121" cy="68" r="3" fill={ink} />
      <path d="M101 83 Q110 86 119 83" fill="none" stroke={lips} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function Hair({ style, color, accent }: { style: string; color: string; accent: string }) {
  if (style === 'bald') return null;
  const sheen = 'rgba(255,255,255,0.18)';
  const shadow = 'rgba(0,0,0,0.32)';
  const dark = 'rgba(0,0,0,0.5)';
  const hatColor = accent;

  if (style === 'buzz') {
    return (
      <g>
        <path d="M76 61 Q80 31 110 27 Q140 31 144 61 Q129 53 118 50 L110 46 L101 50 Q91 53 76 61Z" fill={color} />
        <path d="M81 61 Q85 49 93 38 M97 51 L99 32 M110 46 L110 29 M122 51 L120 32 M139 61 Q135 48 126 38" stroke={shadow} strokeWidth="2" strokeLinecap="round" opacity=".45" />
        <path d="M92 41 Q109 34 127 40" fill="none" stroke={sheen} strokeWidth="2.5" strokeLinecap="round" />
      </g>
    );
  }
  if (style === 'mohawk') {
    return (
      <g>
        <path d="M83 61 Q87 35 108 30 Q132 31 138 61 Q127 54 112 53 Q96 54 83 61Z" fill={shadow} opacity=".55" />
        <path d="M97 51 Q100 27 106 14 Q110 5 115 14 Q121 27 124 51 Q112 45 97 51Z" fill={color} stroke="#050708" strokeWidth="1.2" />
        <path d="M101 51 Q109 36 111 10 Q119 32 121 51" fill="none" stroke={shadow} strokeWidth="2.5" strokeLinecap="round" opacity=".6" />
        <path d="M108 15 Q108 32 103 48 M115 16 Q116 33 121 48" fill="none" stroke={sheen} strokeWidth="1.5" strokeLinecap="round" opacity=".8" />
        <path d="M88 60 Q94 56 101 55 M122 55 Q131 56 137 60" fill="none" stroke={dark} strokeWidth="1.4" strokeLinecap="round" opacity=".55" />
      </g>
    );
  }
  if (style === 'ponytail') {
    return (
      <g>
        <path d="M82 57 Q72 77 70 101 Q68 126 58 149 M89 49 Q77 70 76 96 Q75 122 66 146 M95 43 Q86 68 85 97 Q84 124 76 152 M101 39 Q95 65 96 96 Q96 126 88 155 M118 39 Q124 65 124 96 Q124 126 132 155 M125 43 Q136 68 137 97 Q138 124 146 152 M132 49 Q147 70 150 96 Q153 122 162 146 M139 57 Q153 78 155 103 Q158 128 169 151" fill="none" stroke={color} strokeWidth="4.8" strokeLinecap="round" opacity=".95" />
        <path d="M82 57 Q72 77 70 101 Q68 126 58 149 M89 49 Q77 70 76 96 Q75 122 66 146 M95 43 Q86 68 85 97 Q84 124 76 152 M101 39 Q95 65 96 96 Q96 126 88 155 M118 39 Q124 65 124 96 Q124 126 132 155 M125 43 Q136 68 137 97 Q138 124 146 152 M132 49 Q147 70 150 96 Q153 122 162 146 M139 57 Q153 78 155 103 Q158 128 169 151" fill="none" stroke={dark} strokeWidth="1.15" strokeLinecap="round" opacity=".55" />
        <path d="M75 63 Q79 30 110 26 Q141 30 145 63 Q128 54 110 54 Q92 54 75 63Z" fill={hatColor} stroke={dark} strokeWidth="1.1" />
        <path d="M78 64 Q93 54 110 54 Q128 54 142 64" fill="none" stroke={dark} strokeWidth="2" strokeLinecap="round" opacity=".5" />
        <path d="M87 47 Q97 36 110 34 Q124 36 135 47" fill="none" stroke={sheen} strokeWidth="1.8" strokeLinecap="round" opacity=".56" />
        <path d="M88 69 Q82 94 78 122 M96 67 Q91 88 91 116 M104 66 Q101 87 102 121 M117 66 Q121 87 121 121 M126 67 Q133 88 134 116 M135 69 Q143 94 147 122 M75 83 Q72 105 67 130 M151 83 Q155 106 160 130" fill="none" stroke={sheen} strokeWidth=".9" strokeLinecap="round" opacity=".62" />
      </g>
    );
  }

  return (
    <g transform="translate(-3 0)">
      <path d="M80 62 Q83 34 105 27 Q132 23 144 43 Q133 40 120 43 Q102 47 86 65Z" fill={color} stroke="#050708" strokeWidth="1" />
      <path d="M85 64 Q98 44 119 37 Q136 33 146 45 Q132 52 116 61 Q100 70 87 75 Q84 70 85 64Z" fill={color} />
      <path d="M83 66 Q87 73 96 76 M134 45 Q141 50 141 61" fill="none" stroke={dark} strokeWidth="2.4" strokeLinecap="round" opacity=".55" />
      <path d="M93 60 Q108 43 132 39 M99 69 Q113 57 130 51 M113 38 Q119 31 130 35" fill="none" stroke={sheen} strokeWidth="2" strokeLinecap="round" opacity=".78" />
      <path d="M89 62 Q105 57 119 55 Q130 53 142 47" fill="none" stroke={shadow} strokeWidth="1.5" strokeLinecap="round" opacity=".55" />
    </g>
  );
}

function Accessory({ type, glow }: { type: string; glow: string }) {
  if (type === 'accessory-headphones') {
    return (
      <>
        <path d="M79 63 Q80 31 110 28 Q140 31 141 63" fill="none" stroke="#151b20" strokeWidth="7" />
        <rect x="74" y="58" width="13" height="25" rx="5" fill="#161d22" stroke={glow} />
        <rect x="133" y="58" width="13" height="25" rx="5" fill="#161d22" stroke={glow} />
      </>
    );
  }
  if (type === 'accessory-goggles') {
    return (
      <>
        <rect x="87" y="58" width="19" height="14" rx="5" fill={glow} opacity=".78" stroke="#dff" />
        <rect x="114" y="58" width="19" height="14" rx="5" fill={glow} opacity=".78" stroke="#dff" />
        <path d="M106 64 H114" stroke="#101519" strokeWidth="3" />
      </>
    );
  }
  if (type === 'accessory-crown') {
    return (
      <g fill="none" stroke={glow} strokeWidth="3" style={{ filter: `drop-shadow(0 0 6px ${glow})` }}>
        <path d="M82 37 L89 17 L101 31 L110 10 L120 31 L133 17 L139 39Z" />
        <path d="M87 43 Q110 48 135 43" />
      </g>
    );
  }
  if (type === 'accessory-blackout-shoulder-drone') {
    // Hovers near the right shoulder/back, not above the head.
    return (
      <g style={{ filter: `drop-shadow(0 0 6px ${glow})` }}>
        {/* Drifts in a small orbit around the survivor */}
        <animateTransform attributeName="transform" type="translate" values="0 0; 3 -2; 1 -4; -3 -2; 0 0" dur="3.2s" repeatCount="indefinite" />
        {/* Angular black drone shell */}
        <path d="M150 92 L168 85 L177 96 L170 109 L152 110 Z" fill="#0a0d12" stroke={glow} strokeWidth="2" strokeLinejoin="round" />
        {/* Glowing scan lens */}
        <circle cx="164" cy="98" r="4.2" fill="#04141b" stroke={glow} strokeWidth="1.6" />
        <circle cx="164" cy="98" r="1.8" fill={glow} />
        {/* Short scan beam sweeping the field */}
        <path d="M163 102 L149 121 L161 119 Z" fill={glow} opacity=".18" />
        {/* Signal line */}
        <path d="M177 95 l7 -3 M177 100 l6 2" stroke={glow} strokeWidth="1.4" strokeLinecap="round" opacity=".8" />
        {/* Tiny glitch sparks */}
        <path d="M150 86 l-3 -3 M170 110 l2 4" stroke="#ff174d" strokeWidth="1.4" strokeLinecap="round" opacity=".75" />
      </g>
    );
  }
  if (type === 'accessory-toxic-angel-halo') {
    // Cracked, segmented saint-ring above the head — never a clean ring.
    return (
      <g style={{ filter: `drop-shadow(0 0 6px ${glow})` }}>
        {/* Gentle vertical bounce */}
        <animateTransform attributeName="transform" type="translate" values="0 0; 0 -2.6; 0 0" dur="1.9s" repeatCount="indefinite" />
        {/* Cracked segmented halo — dashes travel for a spinning look */}
        <ellipse cx="110" cy="30" rx="31" ry="9" fill="none" stroke={glow} strokeWidth="3.4" strokeDasharray="13 5 8 6 11 5" opacity=".95">
          <animate attributeName="stroke-dashoffset" from="0" to="48" dur="2.6s" repeatCount="indefinite" />
        </ellipse>
        {/* Inner holy shimmer */}
        <ellipse cx="110" cy="30" rx="31" ry="9" fill="none" stroke="#f8ffe8" strokeWidth="1" strokeDasharray="9 10" opacity=".5" />
        {/* Broken saint-ring pieces drifting free */}
        <path d="M82 28 Q88 22 96 24" fill="none" stroke={glow} strokeWidth="3" strokeLinecap="round" />
        <path d="M124 36 Q132 38 139 33" fill="none" stroke={glow} strokeWidth="3" strokeLinecap="round" />
        {/* Radioactive particles / mist */}
        <circle cx="92" cy="19" r="1.6" fill={glow} />
        <circle cx="130" cy="21" r="1.3" fill={glow} opacity=".85" />
        <circle cx="110" cy="15" r="1.4" fill="#39ff14" opacity=".7" />
      </g>
    );
  }
  return null;
}
