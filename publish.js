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

Hey there! If you're interested in showing off your own wallpaper, consider adding it to the collection for others to download through the Octos app.

All mods on this repo are available through the [Octos](https://github.com/underpig1/octos) app.

See resources and guides for creating your own live wallpaper in the [docs](https://underpig1.github.io/octos/docs/?t=installation)

# Publish your mod
It's as easy as...
1. Fork this repo
2. Add your own custom mod folder under \`src/\`
3. Run \`npm run build\` to rebuild this document and convert all files under \`src/\` into .omod files
4. Submit a merge request

# Gallery (auto-generated)
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
    md += `${data.image ? `<img src='${data.image}' alt='${data.name}' width='300px'>` : "[No image]"}

### ${data.name}${data.author ? " - By " + data.author : ""}${data.description ? "\n" + data.description : ""}
<br>
<br>
<br>
`
}

function publishFromFile(dir) {
    if (isZipped(dir)) unzip(dir, "%temp%\\temp-mod").then((target) => publishMod(target));
    else publishMod(dir);
}

function publishMod(dir) {
    var config = readJSON(path.join(dir, "mod.json"));
    if (config) {
        var name = config.name;
        if (config.include === false) return;
        if (!name) name = path.basename(dir);
        var newPath = path.relative(__dirname, path.join(dist, path.basename(dir) + ".omod"));
        content[name] = config;
        content[name].path = newPath;
        var image = config.image;
        if (image) {
            var newImagePath = path.relative(__dirname, path.join(images, `${name}-${path.basename(image)}`));
            fs.copySync(path.join(dir, image), newImagePath, { overwrite: true });
            content[name].image = newImagePath;
        }
        zip(dir, newPath);
        writeContent();
        return content[name];
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
    md += "Learn more about how to [publish your own mod](https://underpig1.github.io/octos/docs/?t=publish)"
    writeMD();
}

function zip(dir, target) {
    return new Promise((resolve, reject) => {
        const archiver = require("archiver");
        const archive = archiver("zip", { zlib: { level: 9 } });
        const stream = fs.createWriteStream(target);

        stream.on("close", () => resolve(target));
        archive.directory(dir, false).on("error", reject).pipe(stream);
        archive.finalize();
    });
}

function unzip(dir, target) {
    return new Promise((resolve, reject) => {
        const unzipper = require("unzipper");
        if (!fs.existsSync(target)) fs.mkdirSync(target);
        else fs.emptyDirSync(target);

        fs.createReadStream(dir)
            .on("entry", entry => entry.autodrain())
            .pipe(unzipper.Parse())
            .on("entry", (entry) => entry.pipe(fs.createWriteStream(path.join(target, entry.path))))
            .on("finish", () => resolve(target)).on("error", reject);
    });
}

function isZipped(dir) {
    return !fs.lstatSync(dir).isDirectory();
}

parseArgs();