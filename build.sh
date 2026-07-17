rm -rf ./dist
rm -rf ./src/bp/scripts
tsc
mkdir ./dist/lib/math
cp ./scripts/lib/math/minecraft-math.js ./dist/lib/math
cp -r ./dist/ ./src/bp
mv ./src/bp/dist ./src/bp/scripts
echo "done"