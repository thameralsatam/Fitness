import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// 1. Full Square/Adaptive Icon with dark emerald background and dumbbell
const fullIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#18392c" />
      <stop offset="50%" stop-color="#13271e" />
      <stop offset="100%" stop-color="#0b1712" />
    </linearGradient>
    <linearGradient id="plateGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#34D399" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background container -->
  <rect width="512" height="512" rx="115" fill="url(#bgGrad)" />
  <rect x="6" y="6" width="500" height="500" rx="110" fill="none" stroke="#34D399" stroke-width="6" stroke-opacity="0.3" />

  <!-- Centered Rotated Dumbbell -->
  <g transform="translate(256, 256) rotate(-15) translate(-256, -256)">
    <!-- Dumbbell Central Bar -->
    <rect x="180" y="238" width="152" height="36" rx="18" fill="#F1F5F9" filter="url(#glow)" />
    <rect x="236" y="232" width="40" height="48" rx="8" fill="#6EE7B7" />

    <!-- Left Weight Plates -->
    <!-- Outer small plate -->
    <rect x="100" y="200" width="28" height="112" rx="12" fill="#047857" />
    <!-- Middle plate -->
    <rect x="132" y="172" width="30" height="168" rx="14" fill="#059669" />
    <!-- Inner large plate -->
    <rect x="166" y="146" width="34" height="220" rx="16" fill="url(#plateGrad)" />

    <!-- Right Weight Plates -->
    <!-- Inner large plate -->
    <rect x="312" y="146" width="34" height="220" rx="16" fill="url(#plateGrad)" />
    <!-- Middle plate -->
    <rect x="350" y="172" width="30" height="168" rx="14" fill="#059669" />
    <!-- Outer small plate -->
    <rect x="384" y="200" width="28" height="112" rx="12" fill="#047857" />

    <!-- Plate Rim Highlights -->
    <rect x="170" y="152" width="8" height="208" rx="4" fill="#6EE7B7" opacity="0.6" />
    <rect x="316" y="152" width="8" height="208" rx="4" fill="#6EE7B7" opacity="0.6" />
  </g>
</svg>
`;

// 2. Round Icon
const roundIconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bgGradR" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#18392c" />
      <stop offset="50%" stop-color="#13271e" />
      <stop offset="100%" stop-color="#0b1712" />
    </linearGradient>
    <linearGradient id="plateGradR" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#34D399" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <filter id="glowR" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Round Background -->
  <circle cx="256" cy="256" r="256" fill="url(#bgGradR)" />
  <circle cx="256" cy="256" r="250" fill="none" stroke="#34D399" stroke-width="6" stroke-opacity="0.3" />

  <!-- Centered Rotated Dumbbell -->
  <g transform="translate(256, 256) rotate(-15) translate(-256, -256)">
    <!-- Dumbbell Central Bar -->
    <rect x="180" y="238" width="152" height="36" rx="18" fill="#F1F5F9" filter="url(#glowR)" />
    <rect x="236" y="232" width="40" height="48" rx="8" fill="#6EE7B7" />

    <!-- Left Weight Plates -->
    <rect x="100" y="200" width="28" height="112" rx="12" fill="#047857" />
    <rect x="132" y="172" width="30" height="168" rx="14" fill="#059669" />
    <rect x="166" y="146" width="34" height="220" rx="16" fill="url(#plateGradR)" />

    <!-- Right Weight Plates -->
    <rect x="312" y="146" width="34" height="220" rx="16" fill="url(#plateGradR)" />
    <rect x="350" y="172" width="30" height="168" rx="14" fill="#059669" />
    <rect x="384" y="200" width="28" height="112" rx="12" fill="#047857" />

    <!-- Highlights -->
    <rect x="170" y="152" width="8" height="208" rx="4" fill="#6EE7B7" opacity="0.6" />
    <rect x="316" y="152" width="8" height="208" rx="4" fill="#6EE7B7" opacity="0.6" />
  </g>
</svg>
`;

// 3. Foreground Only (transparent background for adaptive icons)
const foregroundSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="plateGradF" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#34D399" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <filter id="glowF" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Scaled down to fit 66% safe zone of 108dp adaptive icon -->
  <g transform="translate(256, 256) scale(0.68) rotate(-15) translate(-256, -256)">
    <!-- Dumbbell Central Bar -->
    <rect x="180" y="238" width="152" height="36" rx="18" fill="#F1F5F9" filter="url(#glowF)" />
    <rect x="236" y="232" width="40" height="48" rx="8" fill="#6EE7B7" />

    <!-- Left Weight Plates -->
    <rect x="100" y="200" width="28" height="112" rx="12" fill="#047857" />
    <rect x="132" y="172" width="30" height="168" rx="14" fill="#059669" />
    <rect x="166" y="146" width="34" height="220" rx="16" fill="url(#plateGradF)" />

    <!-- Right Weight Plates -->
    <rect x="312" y="146" width="34" height="220" rx="16" fill="url(#plateGradF)" />
    <rect x="350" y="172" width="30" height="168" rx="14" fill="#059669" />
    <rect x="384" y="200" width="28" height="112" rx="12" fill="#047857" />

    <!-- Highlights -->
    <rect x="170" y="152" width="8" height="208" rx="4" fill="#6EE7B7" opacity="0.6" />
    <rect x="316" y="152" width="8" height="208" rx="4" fill="#6EE7B7" opacity="0.6" />
  </g>
</svg>
`;

const SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

async function run() {
  const baseRes = path.resolve('android/app/src/main/res');

  for (const [folder, size] of Object.entries(SIZES)) {
    const dir = path.join(baseRes, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // ic_launcher.png
    await sharp(Buffer.from(fullIconSvg))
      .resize(size, size)
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    // ic_launcher_round.png
    await sharp(Buffer.from(roundIconSvg))
      .resize(size, size)
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    // ic_launcher_foreground.png
    // Adaptive foreground is 108dp equivalent (size * 108 / 48)
    const fgSize = Math.round((size * 108) / 48);
    await sharp(Buffer.from(foregroundSvg))
      .resize(fgSize, fgSize)
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));

    console.log(`Generated icons for ${folder} (${size}px, fg: ${fgSize}px)`);
  }

  // Also generate web favicon.svg / apple-touch-icon
  fs.writeFileSync('public/favicon.svg', fullIconSvg);
  await sharp(Buffer.from(fullIconSvg)).resize(180, 180).png().toFile('public/apple-touch-icon.png');
  await sharp(Buffer.from(fullIconSvg)).resize(512, 512).png().toFile('public/icon-512.png');
  console.log('Generated web icons and Android launcher assets successfully!');
}

run().catch(console.error);
