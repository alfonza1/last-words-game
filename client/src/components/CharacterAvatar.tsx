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
      {character.outfit === 'outfit-hazmat' && (
        <path d="M81 111 Q110 95 139 111 V184 H81Z" fill="none" stroke="#9dff4f" strokeWidth="3" strokeDasharray="18 5" />
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

      {/* Arms */}
      <path d="M77 116 Q54 136 64 174" fill="none" stroke={outfit.primary} strokeWidth="19" strokeLinecap="round" />
      <path d="M143 116 Q165 136 154 174" fill="none" stroke={outfit.primary} strokeWidth="19" strokeLinecap="round" />
      <circle cx="64" cy="176" r="8" fill={skin} />
      <circle cx="154" cy="176" r="8" fill={skin} />

      {/* Neck + head */}
      <rect x="100" y="83" width="20" height="24" rx="8" fill={skin} />
      <ellipse cx="110" cy="66" rx="32" ry="37" fill={skin} />
      <path d="M83 63 Q110 47 137 63 L134 85 Q110 100 86 84Z" fill="rgba(0,0,0,.08)" />
      <Face expression={character.expression} glow={glow} lips={lips} />

      <Hair style={character.hair} color={hair} glow={glow} />
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
        <path d="M99 84 Q112 91 124 80" fill="none" stroke={lips} strokeWidth="2.8" strokeLinecap="round" />
        <path d="M111 87 Q117 87 122 82" fill="none" stroke="#f1d8cb" strokeWidth="1.35" strokeLinecap="round" opacity=".75" />
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
        <circle cx="99" cy="67" r="3" fill={ink} />
        <circle cx="121" cy="67" r="5.5" fill={glow} opacity=".24" style={{ filter: `drop-shadow(0 0 5px ${glow})` }} />
        <circle cx="121" cy="67" r="2.6" fill={glow} />
        <path d="M101 83 Q110 89 121 81" fill="none" stroke={lips} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M129 70 L135 73 M128 76 L133 80" stroke={glow} strokeOpacity=".55" strokeWidth="1.5" />
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

function Hair({ style, color, glow }: { style: string; color: string; glow: string }) {
  if (style === 'bald') return null;
  const sheen = 'rgba(255,255,255,0.18)';
  const shadow = 'rgba(0,0,0,0.32)';
  const dark = 'rgba(0,0,0,0.5)';

  if (style === 'buzz') {
    return (
      <g>
        <path d="M80 61 Q82 36 101 29 Q116 23 133 35 Q140 42 141 60 Q127 53 110 51 Q95 52 80 61Z" fill={color} />
        <path d="M82 62 Q87 70 94 72 M138 62 Q132 70 125 72" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" opacity=".85" />
        <path d="M84 61 Q92 50 105 47 Q121 45 136 57" fill="none" stroke={dark} strokeWidth="2.2" strokeLinecap="round" opacity=".45" />
        <path d="M88 54 Q96 39 111 35 Q126 37 135 51 M94 63 Q109 58 127 63" fill="none" stroke={shadow} strokeWidth="1.4" strokeLinecap="round" opacity=".58" />
        <path d="M95 39 Q111 31 128 42" fill="none" stroke={sheen} strokeWidth="2.1" strokeLinecap="round" opacity=".75" />
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
        <path d="M79 61 Q84 31 110 27 Q136 31 141 61 Q126 51 110 51 Q94 51 79 61Z" fill={color} />
        <path d="M91 52 Q84 69 84 91 Q84 111 76 126 M101 50 Q96 70 97 94 Q98 116 88 132 M111 50 Q108 72 110 96 Q112 119 105 134 M122 50 Q129 72 128 96 Q128 119 136 132 M132 52 Q143 72 145 94 Q146 112 154 126" fill="none" stroke={color} strokeWidth="7.2" strokeLinecap="round" />
        <path d="M91 52 Q84 69 84 91 Q84 111 76 126 M101 50 Q96 70 97 94 Q98 116 88 132 M111 50 Q108 72 110 96 Q112 119 105 134 M122 50 Q129 72 128 96 Q128 119 136 132 M132 52 Q143 72 145 94 Q146 112 154 126" fill="none" stroke={dark} strokeWidth="1.7" strokeLinecap="round" opacity=".55" />
        <path d="M88 58 Q98 49 110 49 Q123 49 136 58" fill="none" stroke={dark} strokeWidth="2.2" strokeLinecap="round" opacity=".5" />
        <path d="M94 66 Q90 85 90 107 M104 64 Q103 86 104 111 M118 64 Q122 86 123 111 M130 66 Q137 86 139 106" fill="none" stroke={sheen} strokeWidth="1.15" strokeLinecap="round" opacity=".62" />
        <circle cx="94" cy="55" r="3.4" fill={color} stroke={dark} strokeWidth="1" />
        <circle cx="104" cy="52" r="3.2" fill={color} stroke={dark} strokeWidth="1" />
        <circle cx="116" cy="52" r="3.2" fill={color} stroke={dark} strokeWidth="1" />
        <circle cx="127" cy="55" r="3.4" fill={color} stroke={dark} strokeWidth="1" />
        <path d="M94 39 Q110 32 127 39" fill="none" stroke={sheen} strokeWidth="2.2" strokeLinecap="round" opacity=".72" />
      </g>
    );
  }
  if (style === 'signal-braids') {
    return (
      <g>
        <path d="M80 61 Q84 32 110 27 Q136 32 140 61 Q127 53 110 52 Q94 53 80 61Z" fill={color} />
        <path d="M91 55 Q91 38 100 31 M102 53 Q104 34 110 29 M118 53 Q116 34 110 29 M129 55 Q128 38 120 31" fill="none" stroke={dark} strokeWidth="1.4" strokeLinecap="round" opacity=".58" />
        <path d="M94 54 Q91 70 91 86 Q91 103 84 116 M104 52 Q101 69 102 88 Q103 106 96 122 M116 52 Q119 69 118 88 Q117 106 124 122 M126 54 Q130 70 131 86 Q132 103 139 116" fill="none" stroke={color} strokeWidth="5.4" strokeLinecap="round" />
        <path d="M94 54 Q91 70 91 86 Q91 103 84 116 M104 52 Q101 69 102 88 Q103 106 96 122 M116 52 Q119 69 118 88 Q117 106 124 122 M126 54 Q130 70 131 86 Q132 103 139 116" fill="none" stroke={shadow} strokeWidth="1.2" strokeLinecap="round" opacity=".72" />
        <path d="M91 77 H96 M101 82 H107 M114 82 H120 M126 77 H132" stroke={glow} strokeWidth="3" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${glow})` }} />
        <path d="M96 39 Q110 31 124 39" fill="none" stroke={glow} strokeOpacity=".85" strokeWidth="2.1" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 5px ${glow})` }} />
        <circle cx="110" cy="36" r="4.2" fill={color} stroke={glow} strokeWidth="1.4" />
      </g>
    );
  }

  return (
    <g>
      <path d="M80 62 Q83 34 105 27 Q132 23 144 43 Q133 40 120 43 Q102 47 86 65Z" fill={color} stroke="#050708" strokeWidth="1" />
      <path d="M85 64 Q98 44 119 37 Q136 33 146 45 Q132 52 116 61 Q100 70 87 75 Q84 70 85 64Z" fill={color} />
      <path d="M83 66 Q87 73 96 76 M134 45 Q141 50 141 61" fill="none" stroke={dark} strokeWidth="2.4" strokeLinecap="round" opacity=".55" />
      <path d="M93 60 Q108 43 132 39 M99 69 Q113 57 130 51 M113 38 Q119 31 130 35" fill="none" stroke={sheen} strokeWidth="2" strokeLinecap="round" opacity=".78" />
      <path d="M89 62 Q105 57 119 55 Q130 53 142 47" fill="none" stroke={shadow} strokeWidth="1.5" strokeLinecap="round" opacity=".55" />
    </g>
  );
}

function Accessory({ type, glow }: { type: string; glow: string }) {
  if (type === 'accessory-cap') {
    return (
      <>
        <path d="M80 48 Q110 24 140 49 L135 59 Q108 48 82 59Z" fill="#26333a" stroke={glow} />
        <path d="M116 50 Q145 49 151 57 Q131 60 116 56Z" fill="#11181c" />
      </>
    );
  }
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
  if (type === 'accessory-mask') {
    return (
      <path d="M88 72 Q110 62 132 72 L126 92 L110 101 L94 92Z" fill="#10171a" stroke="#d9e2dc" strokeWidth="2" />
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
  return null;
}
