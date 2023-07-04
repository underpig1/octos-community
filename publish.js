#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");

const source = path.join(__dirname, "src");
const images = path.join(__dirname, "images");
const dist = path.join(__dirname, "mods");
const contentPath = path.join(__dirname, "content.json");
const content = require(contentPath);
const mdpath = path.join(__dirname, "readme.md");
var md = `
# A collection of mods for [Octos](https://github.com/underpig1/octos)

`;

function readJSON(dir) {
    if (fs.existsSync(dir)) return require(dir);
    else return null;
}

function writeContent() {
    fs.writeFileSync(contentPath, JSON.stringify(content, null, 4));
}

function writeMD() {
    fs.writeFileSync(mdpath, md);
}

function updateMD(data) {
    md += `${data.image ? `<img src=${data.image} alt='${data.name}' width='200px'>` : "[No image]"}

### ${data.name}${data.author ? "\n#### By " + data.author : ""}${data.description ? "\n" + data.description : ""}
***
`
}

function publishMod(dir) {
    var config = readJSON(path.join(dir, "mod.json"));
    if (config) {
        var name = config.name;
        if (name) {
            var newPath = path.relative(__dirname, path.join(dist, path.basename(dir)));
            fs.copySync(dir, newPath, { overwrite: true });
            content[name] = config;
            content[name].path = newPath;
            var image = config.image;
            if (image) {
                var newImagePath = path.relative(__dirname, path.join(images, `${name}-${path.basename(image)}`));
                fs.copySync(path.join(dir, image), newImagePath, { overwrite: true });
                content[name].image = newImagePath;
            }
            writeContent();
            return content[name];
        }
    }
}

function parseArgs() {
    var ti = process.argv.findIndex((x) => x == "--path" || x == "-p");
    if (ti != -1) {
        if (ti <= process.argv.length) {
            var target = process.argv[ti + 1];
            if (target) return publishMod(path.resolve(__dirname, target));
        }
    }

    for (var dir of fs.readdirSync(source)) {
        var target = path.resolve(__dirname, source, dir);
        console.log("Building " + target);
        var data = publishMod(target);
        if (data) updateMD(data);
    }
    md += "[Publish your own mod](https://github.com/underpig1/octos)"
    writeMD();
}

parseArgs();