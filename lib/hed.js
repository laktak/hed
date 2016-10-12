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

function edit(editor, file) {
  var ext=path.extname(file), name=path.basename(file, ext), dir=path.dirname(file);
  var dropped;

  if (!fs.existsSync(file)) return Promise.reject("File not found: "+file);

  if (ext==".hjson") {
    // already hjson
    return wait(editor, [file])
    .then(function() {
      return { hjson: file };
    });
  }

  // load org
  var org=Hjson.rt.parse(fs.readFileSync(file, "utf8"));
  // check for existing hjson version
  var hfile=path.join(dir, name+".hed.hjson");
  if (fs.existsSync(hfile)) {
    // merge comments to org
    var orgf=Hjson.rt.parse(fs.readFileSync(hfile, "utf8"));
    dropped=mergeComments(org, orgf);
  }

  // write and edit hjson
  fs.writeFileSync(hfile, Hjson.rt.stringify(org), "utf8");
  return wait(editor, [hfile])
  .then(function() {
    // convert back to JSON
    var up=Hjson.rt.parse(fs.readFileSync(hfile, "utf8"));
    fs.writeFileSync(file, JSON.stringify(up, null, 2), "utf8");
    return { json: file, hjson: hfile, droppedComments: dropped };
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

function isArray(value) { return Object.prototype.toString.apply(value) === '[object Array]'; }

function mergeComments(target, source) {
  var dropList={};
  mergeC(target, source, dropList, "");
  return dropList;
}

function drop(source, dropList, path, value) {

  if (value) dropList[path]=value.join("\n").trim();
  if (source===null || typeof source!=='object') return;

  var comments=source.__COMMENTS__;

  var i, length; // loop
  if (isArray(source)) {
    for (i=0, length=source.length; i<length; i++) {
      var ipath=path+"/["+i+"]";
      drop(source[i], drop, ipath, comments?comments[i]:null);
    }
  } else {
    var keys=comments?comments.o:Object.keys(source);
    for (i=0, length=keys.length; i<length; i++) {
      var k=keys[i];
      drop(source[k], dropList, path+"/"+k, comments?comments.c[k]:null);
    }
  }
}

function mergeC(target, source, dropList, path) {

  // comments can only be in an array/object
  if (target===null || typeof target!=='object' || source===null || typeof source!=='object')
    return drop(source, dropList, path);
  var array=isArray(target);

  var tcomments, scomments=source.__COMMENTS__;
  // can't handle missing comments or array/object mismatch
  if (!scomments || array !== isArray(source))
    return drop(source, dropList, path);

  Object.defineProperty(target, "__COMMENTS__", { enumerable: false, writable: true });

  var i, length; // loop
  if (array) {
    tcomments=target.__COMMENTS__=[];
    for (i=0, length=target.length; i<length; i++) {
      tcomments.push(scomments[i]);
      if (source.length>i) mergeC(target[i], source[i]);
    }
    for (length=source.length; i<length; i++)
      drop(source[i], dropList, path+"/["+i+"]", scomments[i]);
  } else {
    tcomments=target.__COMMENTS__={ c: {}, o: []  };
    // wsc will contain all keys from source
    for (i=0, length=scomments.o.length; i<length; i++) {
      var k=scomments.o[i];
      if (Object.prototype.hasOwnProperty.call(target, k)) {
        tcomments.o.push(k);
        tcomments.c[k]=scomments.c[k];
        mergeC(target[k], source[k]);
      } else drop(source[k], dropList, path+"/"+k, scomments.c[k]);
    }
  }
}

module.exports={
  edit: edit,
};
