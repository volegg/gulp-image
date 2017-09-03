'use strict';

const path = require('path');
const execBuffer = require('exec-buffer');
const isPng = require('is-png');
const isJpg = require('is-jpg');
const isGif = require('is-gif');
const isSvg = require('is-svg');

const optipng = buffer => execBuffer({
  input : buffer,
  bin   : require('optipng-bin'),
  args  : [
    '-i 1',
    '-strip all',
    '-fix',
    '-o7',
    '-force',
    '-out', execBuffer.output,
    execBuffer.input
  ]
});

const pngquant = buffer => execBuffer({
  input : buffer,
  bin   : require('pngquant-bin'),
  args  : [
    '--speed=1',
    '--force', '256',
    '--output', execBuffer.output,
    execBuffer.input
  ]
});

const pngcrush = buffer => execBuffer({
  input : buffer,
  bin   : require('pngcrush-bin'),
  args  : [
    '-rem alla',
    '-rem text',
    '-brute',
    '-reduce',
    execBuffer.input,
    execBuffer.output
  ]
});

const zopflipng = buffer => execBuffer({
  input : buffer,
  bin   : require('zopflipng-bin'),
  args  : [
    '-y',
    '--lossy_8bit',
    '--lossy_transparent',
    execBuffer.input,
    execBuffer.output
  ]
});

const gifsicle = buffer => execBuffer({
  input : buffer,
  bin   : require('gifsicle'),
  args  : [
    '--optimize',
    '--output',
    execBuffer.output,
    execBuffer.input
  ]
});

const jpegRecompress = buffer => execBuffer({
  input : buffer,
  bin   : require('jpeg-recompress-bin'),
  args  : [
    '--strip',
    '--quality', 'medium',
    '--min', 40,
    '--max', 80,
    execBuffer.input,
    execBuffer.output
  ]
});

const mozjpeg = buffer => execBuffer({
  input : buffer,
  bin   : require('mozjpeg'),
  args  : [
    '-optimize',
    '-progressive',
    '-outfile', execBuffer.output,
    execBuffer.input
  ]
});

const guetzli = buffer => execBuffer({
  input : buffer,
  bin   : require('guetzli'),
  args  : [
    '--quality', 85,
    execBuffer.input,
    execBuffer.output
  ]
});

const svgo = (buffer, options) => {
  const args = [
    '--input', execBuffer.input,
    '--output', execBuffer.output
  ];

  if (Array.isArray(options.enable)) {
    options.enable.forEach(enable => {
      args.push(`--enable=${enable}`);
    });
  }

  if (Array.isArray(options.disable)) {
    options.disable.forEach(disable => {
      args.push(`--disable=${disable}`);
    });
  }

  return execBuffer({
    input : buffer,
    bin   : path.join(path.dirname(require.resolve('exec-buffer')), '../svgo/bin/svgo'),
    args  : args
  });
}

module.exports = (buffer, options) => {
  if (isJpg(buffer)) {
    return Promise.resolve(buffer)
      .then(buffer => options.jpegRecompress ? jpegRecompress(buffer) : buffer)
      .then(buffer => options.mozjpeg ? mozjpeg(buffer) : buffer)
      .then(buffer => options.guetzli ? guetzli(buffer) : buffer);
  } else if (isPng(buffer)) {
    return Promise.resolve(buffer)
      .then(buffer => options.pngquant ? pngquant(buffer) : buffer)
      .then(buffer => options.optipng ? optipng(buffer) : buffer)
      .then(buffer => options.zopflipng ? zopflipng(buffer) : buffer);
  } else if (isGif(buffer)) {
    return Promise.resolve(buffer)
      .then(buffer => options.gifsicle ? gifsicle(buffer) : buffer);
  } else if (isSvg(buffer)) {
    return Promise.resolve(buffer)
      .then(buffer => options.svgo ? svgo(buffer, options.svgo) : buffer);
  }

  return Promise.resolve(buffer);
};
