#!/usr/bin/env node

/**
 * Performance Audit Script for ZenRent
 * Analyzes bundle sizes, dependencies, and performance metrics
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 ZenRent Performance Audit Report');
console.log('=====================================\n');

// Check bundle sizes
function analyzeBundleSizes() {
  console.log('📦 Bundle Analysis:');
  
  const buildDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(buildDir)) {
    console.log('❌ No build found. Run `npm run build` first.\n');
    return;
  }

  try {
    const buildManifest = path.join(buildDir, 'build-manifest.json');
    if (fs.existsSync(buildManifest)) {
      const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf8'));
      console.log('✅ Build manifest found');
      console.log(`   Pages: ${Object.keys(manifest.pages).length}`);
    }

    const staticDir = path.join(buildDir, 'static');
    if (fs.existsSync(staticDir)) {
      const chunks = fs.readdirSync(path.join(staticDir, 'chunks')).filter(f => f.endsWith('.js'));
      console.log(`   JavaScript chunks: ${chunks.length}`);
      
      // Find largest chunks
      const chunkSizes = chunks.map(chunk => {
        const filePath = path.join(staticDir, 'chunks', chunk);
        const stats = fs.statSync(filePath);
        return { name: chunk, size: stats.size };
      }).sort((a, b) => b.size - a.size);

      console.log('   Largest chunks:');
      chunkSizes.slice(0, 5).forEach(chunk => {
        const sizeKB = (chunk.size / 1024).toFixed(2);
        console.log(`     ${chunk.name}: ${sizeKB} KB`);
      });
    }
  } catch (error) {
    console.log('❌ Error analyzing bundle:', error.message);
  }
  
  console.log('');
}

// Check dependencies
function analyzeDependencies() {
  console.log('📚 Dependency Analysis:');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = Object.keys(packageJson.dependencies || {});
    const devDeps = Object.keys(packageJson.devDependencies || {});
    
    console.log(`   Production dependencies: ${deps.length}`);
    console.log(`   Development dependencies: ${devDeps.length}`);
    
    // Check for heavy dependencies
    const heavyDeps = [
      '@sentry/nextjs',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'recharts',
      'framer-motion',
      'googleapis'
    ];
    
    const foundHeavyDeps = deps.filter(dep => heavyDeps.includes(dep));
    if (foundHeavyDeps.length > 0) {
      console.log('   ⚠️  Heavy dependencies detected:');
      foundHeavyDeps.forEach(dep => console.log(`     - ${dep}`));
    }
    
    // Check for duplicate functionality
    const duplicates = [];
    if (deps.includes('date-fns') && deps.includes('moment')) {
      duplicates.push('Date libraries: date-fns + moment');
    }
    if (deps.includes('lodash') && deps.includes('ramda')) {
      duplicates.push('Utility libraries: lodash + ramda');
    }
    
    if (duplicates.length > 0) {
      console.log('   ⚠️  Potential duplicate functionality:');
      duplicates.forEach(dup => console.log(`     - ${dup}`));
    }
    
  } catch (error) {
    console.log('❌ Error analyzing dependencies:', error.message);
  }
  
  console.log('');
}

// Check configuration
function analyzeConfiguration() {
  console.log('⚙️  Configuration Analysis:');
  
  try {
    // Check Next.js config
    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
      
      const optimizations = [];
      if (nextConfig.includes('swcMinify')) optimizations.push('SWC minification');
      if (nextConfig.includes('compress')) optimizations.push('Compression');
      if (nextConfig.includes('optimizeCss')) optimizations.push('CSS optimization');
      if (nextConfig.includes('splitChunks')) optimizations.push('Code splitting');
      
      console.log('   Next.js optimizations enabled:');
      optimizations.forEach(opt => console.log(`     ✅ ${opt}`));
      
      if (nextConfig.includes('replaysSessionSampleRate: 0')) {
        console.log('     ✅ Sentry session replays disabled');
      } else if (nextConfig.includes('replaysSessionSampleRate')) {
        console.log('     ⚠️  Sentry session replays may be enabled');
      }
    }
    
    // Check environment variables
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      console.log('   ✅ Environment configuration found');
    }
    
  } catch (error) {
    console.log('❌ Error analyzing configuration:', error.message);
  }
  
  console.log('');
}

// Performance recommendations
function generateRecommendations() {
  console.log('💡 Performance Recommendations:');
  console.log('');
  
  const recommendations = [
    '1. 🚀 Sentry session replays have been disabled for performance',
    '2. 📦 Use dynamic imports for heavy components',
    '3. 🖼️  Optimize images with WebP/AVIF formats',
    '4. 🔄 Implement proper caching strategies',
    '5. 📊 Monitor Core Web Vitals regularly',
    '6. 🗜️  Enable compression in production',
    '7. 🎯 Use React.memo for expensive components',
    '8. 📱 Implement proper code splitting',
    '9. 🔍 Regular bundle analysis with npm run build:analyze',
    '10. ⚡ Consider using a CDN for static assets'
  ];
  
  recommendations.forEach(rec => console.log(`   ${rec}`));
  console.log('');
}

// Run audit
function runAudit() {
  analyzeBundleSizes();
  analyzeDependencies();
  analyzeConfiguration();
  generateRecommendations();
  
  console.log('✅ Performance audit complete!');
  console.log('');
  console.log('Next steps:');
  console.log('- Run `npm run build:analyze` for detailed bundle analysis');
  console.log('- Monitor performance with browser dev tools');
  console.log('- Test on slower devices and networks');
}

// Execute audit
runAudit(); 