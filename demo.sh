mkfifo js;
cat sweet-tensors.sjs $(find *.sjs -not -name sweet-tensors.sjs)> js &
nodejs --harmony node_modules/.bin/sjs --module sweet-tensors.sjs js  > demo.js;
