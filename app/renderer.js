const {shell} = require('electron')
const querystring = require('querystring');
var path = require('path');
var fs = require('fs');
var jQuery = null;
var search_keyup_timeout = 0;

function formatBytes(a, b) {
  if (0 == a) {
    return "0 Bytes";
  }
  var c = 1e3, d = b || 2, e = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"], f = Math.floor(Math.log(a) / Math.log(c));
  return parseFloat((a / Math.pow(c, f)).toFixed(d)) + " " + e[f];
}

function array_chunk(input, size) {
  for (var x, i = 0, c = -1, l = input.length, n = []; i < l; i++) {
    (x = i % size) ? n[c][x] = input[i] : n[++c] = [input[i]];
  }
  return n;
}

function strtotime(text, now) {
  var parsed;
  var match;
  var today;
  var year;
  var date;
  var days;
  var ranges;
  var len;
  var times;
  var regex;
  var i;
  var fail = false;
  if (!text) {
    return fail;
  }
  text = text.replace(/^\s+|\s+$/g, "").replace(/\s{2,}/g, " ").replace(/[\t\r\n]/g, "").toLowerCase();
  var pattern = new RegExp(["^(\\d{1,4})", "([\\-\\.\\/:])", "(\\d{1,2})", "([\\-\\.\\/:])", "(\\d{1,4})", "(?:\\s(\\d{1,2}):(\\d{2})?:?(\\d{2})?)?", "(?:\\s([A-Z]+)?)?$"].join(""));
  match = text.match(pattern);
  if (match && match[2] === match[4]) {
    if (match[1] > 1901) {
      switch(match[2]) {
        case "-":
          if (match[3] > 12 || match[5] > 31) {
            return fail;
          }
          return new Date(match[1], parseInt(match[3], 10) - 1, match[5], match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
        case ".":
          return fail;
        case "/":
          if (match[3] > 12 || match[5] > 31) {
            return fail;
          }
          return new Date(match[1], parseInt(match[3], 10) - 1, match[5], match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
      }
    } else {
      if (match[5] > 1901) {
        switch(match[2]) {
          case "-":
            if (match[3] > 12 || match[1] > 31) {
              return fail;
            }
            return new Date(match[5], parseInt(match[3], 10) - 1, match[1], match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
          case ".":
            if (match[3] > 12 || match[1] > 31) {
              return fail;
            }
            return new Date(match[5], parseInt(match[3], 10) - 1, match[1], match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
          case "/":
            if (match[1] > 12 || match[3] > 31) {
              return fail;
            }
            return new Date(match[5], parseInt(match[1], 10) - 1, match[3], match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
        }
      } else {
        switch(match[2]) {
          case "-":
            if (match[3] > 12 || match[5] > 31 || match[1] < 70 && match[1] > 38) {
              return fail;
            }
            year = match[1] >= 0 && match[1] <= 38 ? +match[1] + 2000 : match[1];
            return new Date(year, parseInt(match[3], 10) - 1, match[5], match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
          case ".":
            if (match[5] >= 70) {
              if (match[3] > 12 || match[1] > 31) {
                return fail;
              }
              return new Date(match[5], parseInt(match[3], 10) - 1, match[1], match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
            }
            if (match[5] < 60 && !match[6]) {
              if (match[1] > 23 || match[3] > 59) {
                return fail;
              }
              today = new Date;
              return new Date(today.getFullYear(), today.getMonth(), today.getDate(), match[1] || 0, match[3] || 0, match[5] || 0, match[9] || 0) / 1000;
            }
            return fail;
          case "/":
            if (match[1] > 12 || match[3] > 31 || match[5] < 70 && match[5] > 38) {
              return fail;
            }
            year = match[5] >= 0 && match[5] <= 38 ? +match[5] + 2000 : match[5];
            return new Date(year, parseInt(match[1], 10) - 1, match[3], match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
          case ":":
            if (match[1] > 23 || match[3] > 59 || match[5] > 59) {
              return fail;
            }
            today = new Date;
            return new Date(today.getFullYear(), today.getMonth(), today.getDate(), match[1] || 0, match[3] || 0, match[5] || 0) / 1000;
        }
      }
    }
  }
  if (text === "now") {
    return now === null || isNaN(now) ? (new Date).getTime() / 1000 | 0 : now | 0;
  }
  if (!isNaN(parsed = Date.parse(text))) {
    return parsed / 1000 | 0;
  }
  pattern = new RegExp(["^([0-9]{4}-[0-9]{2}-[0-9]{2})", "[ t]", "([0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]+)?)", "([\\+-][0-9]{2}(:[0-9]{2})?|z)"].join(""));
  match = text.match(pattern);
  if (match) {
    if (match[4] === "z") {
      match[4] = "Z";
    } else {
      if (match[4].match(/^([+-][0-9]{2})$/)) {
        match[4] = match[4] + ":00";
      }
    }
    if (!isNaN(parsed = Date.parse(match[1] + "T" + match[2] + match[4]))) {
      return parsed / 1000 | 0;
    }
  }
  date = now ? new Date(now * 1000) : new Date;
  days = {"sun":0, "mon":1, "tue":2, "wed":3, "thu":4, "fri":5, "sat":6};
  ranges = {"yea":"FullYear", "mon":"Month", "day":"Date", "hou":"Hours", "min":"Minutes", "sec":"Seconds"};
  function lastNext(type, range, modifier) {
    var diff;
    var day = days[range];
    if (typeof day !== "undefined") {
      diff = day - date.getDay();
      if (diff === 0) {
        diff = 7 * modifier;
      } else {
        if (diff > 0 && type === "last") {
          diff -= 7;
        } else {
          if (diff < 0 && type === "next") {
            diff += 7;
          }
        }
      }
      date.setDate(date.getDate() + diff);
    }
  }
  function process(val) {
    var splt = val.split(" ");
    var type = splt[0];
    var range = splt[1].substring(0, 3);
    var typeIsNumber = /\d+/.test(type);
    var ago = splt[2] === "ago";
    var num = (type === "last" ? -1 : 1) * (ago ? -1 : 1);
    if (typeIsNumber) {
      num *= parseInt(type, 10);
    }
    if (ranges.hasOwnProperty(range) && !splt[1].match(/^mon(day|\.)?$/i)) {
      return date["set" + ranges[range]](date["get" + ranges[range]]() + num);
    }
    if (range === "wee") {
      return date.setDate(date.getDate() + num * 7);
    }
    if (type === "next" || type === "last") {
      lastNext(type, range, num);
    } else {
      if (!typeIsNumber) {
        return false;
      }
    }
    return true;
  }
  times = "(years?|months?|weeks?|days?|hours?|minutes?|min|seconds?|sec" + "|sunday|sun\\.?|monday|mon\\.?|tuesday|tue\\.?|wednesday|wed\\.?" + "|thursday|thu\\.?|friday|fri\\.?|saturday|sat\\.?)";
  regex = "([+-]?\\d+\\s" + times + "|" + "(last|next)\\s" + times + ")(\\sago)?";
  match = text.match(new RegExp(regex, "gi"));
  if (!match) {
    return fail;
  }
  for (i = 0, len = match.length; i < len; i++) {
    if (!process(match[i])) {
      return fail;
    }
  }
  return date.getTime() / 1000;
}

function date(format, timestamp) {
  var a, jsdate = new Date(timestamp ? timestamp * 1000 : null);
  var pad = function(n, c) {
    if ((n = n + "").length < c) {
      return (new Array(++c - n.length)).join("0") + n;
    } else {
      return n;
    }
  };
  var txt_weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var txt_ordin = {1:"st", 2:"nd", 3:"rd", 21:"st", 22:"nd", 23:"rd", 31:"st"};
  var txt_months = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var f = {d:function() {
    return pad(f.j(), 2);
  }, D:function() {
    t = f.l();
    return t.substr(0, 3);
  }, j:function() {
    return jsdate.getDate();
  }, l:function() {
    return txt_weekdays[f.w()];
  }, N:function() {
    return f.w() + 1;
  }, S:function() {
    return txt_ordin[f.j()] ? txt_ordin[f.j()] : "th";
  }, w:function() {
    return jsdate.getDay();
  }, z:function() {
    return (jsdate - new Date(jsdate.getFullYear() + "/1/1")) / 864e5 >> 0;
  }, W:function() {
    var a = f.z(), b = 364 + f.L() - a;
    var nd2, nd = ((new Date(jsdate.getFullYear() + "/1/1")).getDay() || 7) - 1;
    if (b <= 2 && (jsdate.getDay() || 7) - 1 <= 2 - b) {
      return 1;
    } else {
      if (a <= 2 && nd >= 4 && a >= 6 - nd) {
        nd2 = new Date(jsdate.getFullYear() - 1 + "/12/31");
        return date("W", Math.round(nd2.getTime() / 1000));
      } else {
        return 1 + (nd <= 3 ? (a + nd) / 7 : (a - (7 - nd)) / 7) >> 0;
      }
    }
  }, F:function() {
    return txt_months[f.n()];
  }, m:function() {
    return pad(f.n(), 2);
  }, M:function() {
    t = f.F();
    return t.substr(0, 3);
  }, n:function() {
    return jsdate.getMonth() + 1;
  }, t:function() {
    var n;
    if ((n = jsdate.getMonth() + 1) == 2) {
      return 28 + f.L();
    } else {
      if (n & 1 && n < 8 || !(n & 1) && n > 7) {
        return 31;
      } else {
        return 30;
      }
    }
  }, L:function() {
    var y = f.Y();
    return !(y & 3) && (y % 1e2 || !(y % 4e2)) ? 1 : 0;
  }, Y:function() {
    return jsdate.getFullYear();
  }, y:function() {
    return (jsdate.getFullYear() + "").slice(2);
  }, a:function() {
    return jsdate.getHours() > 11 ? "pm" : "am";
  }, A:function() {
    return f.a().toUpperCase();
  }, B:function() {
    var off = (jsdate.getTimezoneOffset() + 60) * 60;
    var theSeconds = jsdate.getHours() * 3600 + jsdate.getMinutes() * 60 + jsdate.getSeconds() + off;
    var beat = Math.floor(theSeconds / 86.4);
    if (beat > 1000) {
      beat -= 1000;
    }
    if (beat < 0) {
      beat += 1000;
    }
    if (String(beat).length == 1) {
      beat = "00" + beat;
    }
    if (String(beat).length == 2) {
      beat = "0" + beat;
    }
    return beat;
  }, g:function() {
    return jsdate.getHours() % 12 || 12;
  }, G:function() {
    return jsdate.getHours();
  }, h:function() {
    return pad(f.g(), 2);
  }, H:function() {
    return pad(jsdate.getHours(), 2);
  }, i:function() {
    return pad(jsdate.getMinutes(), 2);
  }, s:function() {
    return pad(jsdate.getSeconds(), 2);
  }, O:function() {
    var t = pad(Math.abs(jsdate.getTimezoneOffset() / 60 * 100), 4);
    if (jsdate.getTimezoneOffset() > 0) {
      t = "-" + t;
    } else {
      t = "+" + t;
    }
    return t;
  }, P:function() {
    var O = f.O();
    return O.substr(0, 3) + ":" + O.substr(3, 2);
  }, c:function() {
    return f.Y() + "-" + f.m() + "-" + f.d() + "T" + f.h() + ":" + f.i() + ":" + f.s() + f.P();
  }, U:function() {
    return Math.round(jsdate.getTime() / 1000);
  }};
  return format.replace(/[\\]?([a-zA-Z])/g, function(t, s) {
    if (t != s) {
      ret = s;
    } else {
      if (f[s]) {
        ret = f[s]();
      } else {
        ret = s;
      }
    }
    return ret;
  });
}

document.onclick = function(e) {
  e.preventDefault();
  if (e.target.tagName === "A") {
    shell.openExternal(e.target.href);
  }
  return false;
};

document.ondragover = document.ondrop = function(e) {
  e.preventDefault();
  return false;
};

var holder = document.getElementById("holder");
holder.ondragover = function() {
  this.className = "hover";
  return false;
};

holder.ondragleave = holder.ondragend = function() {
  this.className = "";
  return false;
};

holder.ondrop = function (e) {
	this.className = '';
	e.preventDefault();
	
	clearTimeout(search_keyup_timeout);
	var file = e.dataTransfer.files[0];
	jQuery('#holder, button').hide();
	jQuery('.container').css('display', 'block');

	jQuery('.items').html('<div>'+file.path+'</div><div class="lines">Log file lines: <span>~</span></div><div class="pr">Parse progress: <span>~</span></div><div class="statfiles">Parsed files in log: <span>~</span></div><br />'+
	'<table style="border-spacing: 0;"><tbody><tr><td style="vertical-align: top;">Filepath filter:</td><td style="vertical-align: top;"><input type="search" style="margin: 0 0 0 6px;padding: 2px 4px;"></td></tr></tbody></table>'+
	'<table id="tbl" class="tablesorter"> <thead> <tr> <th>Filepath</th> <th>Access count</th> <th>Last access</th> <th>Unique IPs count</th> <th>Tx</th> <th>Rx</th> <th>Total</th></tr> </thead> <tbody> </tbody></table>');

	fs.readFile(path.normalize(file.path), {encoding: 'utf8'}, function(err, data) {
		if(err) alert('read file error', err);
		else {
			jQuery('.items .pr span').text('0%');
			jQuery('.items .statfiles span').text('0');
			var lines = data.split("\n");
			data = null;

			var lines_len = lines.length;
			jQuery('.items .lines span').text(lines_len);

			var files_top = {};
			var lines_pr = 0;
			var lines_co = 0;
			var lines_chunks = array_chunk(lines, Math.round(lines_len / 200));
			
			var iterator = function(cb) {
				if(lines_chunks.length > 0) {
					let _lines = lines_chunks.shift();

					_lines.forEach(function(line) {
						lines_pr++;
						lines_co++;

						if(lines_co > 100) {
							lines_co = 0;
							let per = parseFloat((lines_pr / lines_len) * 100).toFixed(2);
							jQuery('.items .pr span').text((per > 100 ? 100 : per) + '% ('+ lines_pr +' lines parsed)');
						}

						let str = line.split('	');
						let _date = str.shift();
						let parsed = querystring.parse(str.join('	'), '	', ':');

						let timestamp = 0;
						
						try {
							timestamp = strtotime(_date.replace('_', ' '));
						} catch(e) {}
						
						var __path = (parsed.path + '');
						if(__path.indexOf('/') >= 0) {
							['.gz', '.json', '.css', '.png', '.exe', '.zip', '.jpg', '.js', '.deb', '.woff2', '.ttf', '.TTF', '.woff'].forEach(function(ext) {
								if(__path.indexOf(ext) >= 0 &&
									( (__path.indexOf('.json') === -1 && ext === '.js') || (ext !== '.js') ) &&
									( (__path.indexOf('.woff2') === -1 && ext === '.woff') || (ext !== '.woff') )
								) {
									__path = __path.split(ext).shift() + ext;
								}
							});

							if(!(__path in files_top)) {
								files_top[__path] = {
									count: 0,
									ips: [],
									tx: 0,
									last_access: 0,
									rx: 0,
									total: 0
								};
								jQuery('.items .statfiles span').text(Object.keys(files_top).length);
							}

							if(timestamp > files_top[__path].last_access)
								files_top[__path].last_access = timestamp;

							if(files_top[__path].ips.indexOf(parsed.client) === -1)
								files_top[__path].ips.push(parsed.client);

							files_top[__path].count++;
							files_top[__path].rx += parseInt(parsed.rx, 10);
							files_top[__path].tx += parseInt(parsed.tx, 10);
							files_top[__path].total += parseInt(parsed.rx, 10) + parseInt(parsed.tx, 10);
						}
					});

					_lines = null;
					
					setTimeout(function() {
						iterator(cb);
					}, 0);
				}
				else cb();
			};
			
			iterator(function() {
				lines = null;
				lines_chunks = null;
				lines_pr = null;
				lines_co = null;
				
				jQuery('.items .pr span').text('100% ('+ lines_len +' lines parsed)');
				jQuery('.items .statfiles span').text(Object.keys(files_top).length);

				let _files = [];
				Object.keys(files_top).forEach(function(filename) {
					_files.push({
						filename: filename,
						count: files_top[filename].count,
						ips: files_top[filename].ips.length,
						tx: files_top[filename].rx,
						rx: files_top[filename].tx,
						last_access: files_top[filename].last_access,
						total: files_top[filename].total
					});
				});

				files_top = null;
				lines_len = null;

				_files.sort(function(a, b) {
					return a.total < b.total ? 1 : (a.total > b.total ? -1 : 0);
				}).forEach(function(file) {
					jQuery('#tbl tbody').append('<tr class="row" data-filename="'+file.filename+'"> <td>'+file.filename+'</td> <td>'+ file.count +'</td> <td rel="'+file.last_access+'" class="last_access">'+ date('d.m.Y H:i:s', file.last_access) +'</td> <td>'+ file.ips +'</td> <td rel="'+file.tx+'">'+ formatBytes(file.tx) +'</td> <td rel="'+file.rx+'">'+ formatBytes(file.rx) +'</td> <td rel="'+file.total+'">'+ formatBytes(file.total) +'</td></tr>');
				});

				_files = null;
				
				jQuery("#tbl").tablesorter({
					textExtraction: function(node) {
						return jQuery(node).attr('rel') || jQuery(node).text();
					},
					widgets: ['stickyHeaders']
				});

				jQuery('[type="search"]').bind('keyup change', function() {
					clearTimeout(search_keyup_timeout);
					search_keyup_timeout = setTimeout(function() {
						if(jQuery('[type="search"]').val().trim().length === 0) jQuery('#tbl .row').show();
						else jQuery('#tbl .row').hide().filter('[data-filename*="'+ jQuery('[type="search"]').val() +'"]').show();
					}, 250);
				});

				jQuery('button').show();
			});
		}
	});
	return false;
}

module.exports = function($) {
	jQuery = $;
};