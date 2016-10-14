/*! @preserve
 * Hed, a JSON config edit tool
 * http://hjson.org
 *
 * Copyright 2016 Christian Zangl, MIT license
 */

/*jslint node: true */

var Hjson=require("hjson");
var fs=require("fs");
var path=require("path");
var child_process=require("child_process");

function edit(file, options, showOnly) {

  if (!fs.existsSync(file)) return Promise.reject("File not found: "+file);
  if (!options) return Promise.reject("options required.");

  var editor=options.editor;
  var status=options.status||function(){};
  var onError=options.onError||function(err){ return Promise.reject(err); };
  var ext=path.extname(file), name=path.basename(file, ext), dir=path.dirname(file);

  if (ext==".hjson") {
    // already hjson
    return wait(editor, [file])
    .then(function() {
      return { hjson: file };
    });
  }

  // load org
  // use rt as JSON sometime contains comments (to keep them)
  var org=Hjson.rt.parse(fs.readFileSync(file, "utf8"));

  // check for existing metadata
  var metaFile=path.join(dir, name+".meta");
  if (fs.existsSync(metaFile)) {
    // merge comments to org
    var meta=JSON.parse(fs.readFileSync(metaFile, "utf8"));
    if (meta.hedVersion==="1") Hjson.comments.merge(meta.comments, org);
    else return Promise.reject("Invalid meta: "+metaFile);
  }

  if (showOnly) return Promise.resolve(org);

  // check for existing hjson version
  var hfile=path.join(dir, name+".hjson");
  if (fs.existsSync(hfile)) {
    return Promise.reject("Hjson already exists: "+hfile);
  }

  // add header
  var header=Hjson.comments.header(org)
  Hjson.comments.header(org,
    "# hed: editing '"+name+ext+"' as Hjson. Details: http://hjson.org\n"+
    "# hed: this file will be deleted but your comments are kept in '"+name+".meta'"+
    (header?"\n"+header:""));

  function edit() { return wait(editor, [hfile]); }

  function loadHjson() {
    try { return Hjson.rt.parse(fs.readFileSync(hfile, "utf8")); }
    catch (err) {
      return onError(err)
      .catch(function(err2) {
        fs.unlink(hfile);
        return Promise.reject(err2);
      })
      .then(edit).then(loadHjson);
    }
  }

  // write and edit hjson
  fs.writeFileSync(hfile, Hjson.rt.stringify(org), "utf8");
  status("Opening "+hfile);
  return edit()
  .then(loadHjson)
  .then(function(up) {

    // remove header
    Hjson.comments.header(up, Hjson.comments.header(up).split("\n")
      .filter(function(s) { return s.indexOf("# hed:")!==0; }).join("\n"));

    var meta={ hedVersion: "1", comments: Hjson.comments.extract(up) };
    fs.writeFileSync(file, JSON.stringify(up, null, 2), "utf8");
    fs.writeFileSync(metaFile, JSON.stringify(meta), "utf8");
    fs.unlink(hfile);
    status("Successfully updated "+file+" (+.meta)");
    return { json: file };
  });
}

function wait(bin, args) {
  return new Promise(function(resolve, reject) {
    var p=child_process.spawn(bin, args, { stdio: "inherit", shell: true });
    p.on("error", reject);
    p.on("close", function(code) {
      if (code) reject(code);
      else resolve();
    });
  });
}

module.exports={
  edit: function(file, opt) { return edit(file, opt); },
  show: function(file) { return edit(file, {}, true); },
};
