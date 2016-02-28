// ==UserScript==
// @name        Zulu
// @namespace   dot.noisu
// @include     http://dobrochan.com/*
// @include     http://dobrochan.ru/*
// @version     2.0.1
// @grant       none
// ==/UserScript==

var Zulu = {
	posts: [],
	board_tz: 3, // board's timezone, UTC time

	init: function() {
		this.page.init();
		this.post.init();
		this.reply.init();
		this.gallery.init();
	},

	page: {
		isThread: false,
		board: null,
		thread: null,

		init: function() {
			this._parseURL();
			$('head').append('<style id="zulu-css"></style>');
		},

		applyCSS: function(obj) {
			if (!obj || obj.length < 1) return 1;

			var style_str = "";
			for (var selector in obj) {
				style_str += selector + " {\n";
				for (var prop in obj[selector]) {
					style_str += "  " + prop + ": " +
						obj[selector][prop] + ";\n";
				}
				style_str += "}\n";
			}

			document.querySelector('#zulu-css').innerHTML += style_str;
		},

		_parseURL: function() {
			var dlh = document.location.href;
			var ary = dlh.replace(/\w+:\/+(\w+|\.)+\//,"").
				replace(/\.\w+/,"").split("/");

			if (!ary || ary.length === 0) return 1;

			this.board = ary[0];
			if (ary[1] === 'res') {
				this.isThread = true;
				this.thread = ary[2];
			}

			return this.url;
		}
	},

	reply: {
		init: function() {
			this._addReplyContainers();
			this._processReplies();

			var custom_css = {
				".replies": {
					"clear": "both",
					"padding-top": "0.5em",
					"margin-left": "20px"
				},
				".reply_a": {
					"margin-right": "10px",
					"font-size": "0.8em"
				}
			};
			Zulu.page.applyCSS(custom_css);
		},

		add: function(post_id, reply_id) {
			if (!post_id || !reply_id) return 0;

			var link = $('<a class="reply_a" href="#i' + reply_id +
					'">&gt;&gt;' + reply_id + '</a>');
			link.mouseover(function(e) {
				ShowRefPost(e, Zulu.page.board, post_id, reply_id);
			});

			$('#post_' + post_id + ' .replies').append(link);
		},

		_addReplyContainers: function() {
			var len = Zulu.posts.length;
			for (var i = 0; i < len; ++i) {
				var post_body = Zulu.posts[i].querySelector('.message');
				if (post_body)
					$(post_body).parent().parent().append('<div class="replies"></div>');
			}
		},

		_processReplies: function() {
			var links = document.querySelectorAll('.message a');

			for (var i = 0, len = links.length; i < len; ++i) {
				if (links[i].innerHTML.search(/&gt;&gt;/) !== -1 &&
						links[i].innerHTML.search(/\//) === -1) {
					var reply_id = $(links[i]).parents('.post').attr('id').match(/\d+/);
					var post_id = links[i].innerHTML.match(/\d+/);

					this.add(post_id, reply_id);
				}
			}
		}

	},

	gallery: {
		pics: [],
		pic_types: [],
		current_index: 0,
		is_visible: false,
		is_created: false,
		preload_img: new Image(),
		dom: {},

		init: function() {
			this._applyCustomCSS();

			this.dom.wrapper = document.createElement('div');
			this.dom.wrapper.id = 'gallery-wrapper';
			this.dom.wrapper.style.display = 'none';

			this.dom.wrapper.innerHTML = '<div id="gallery-main">\
				<video id="gallery-player" controls="1" loop="1"></video>\
				</div><div id="gallery-footer"></div>';

			this.dom.ctrl_btn = document.createElement('div');
			this.dom.ctrl_btn.innerHTML = '<svg width="50" height="50">\
				<circle cx="25" cy="25" r="24" style="fill:white;stroke:#CCC;stroke-width:1;"/>\
				<rect height="2" width="20" x="15" y="24" style="fill:black;"/>\
				<rect height="20" width="2" x="24" y="15" style="fill:black;"/></svg>';
			this.dom.ctrl_btn.id = 'gallery-ctrl-btn';

			document.body.appendChild(this.dom.wrapper);
			document.body.appendChild(this.dom.ctrl_btn);

			this.dom.player = document.querySelector("#gallery-player");
			this.dom.footer = document.querySelector("#gallery-footer");

			this.dom.ctrl_btn.addEventListener("click", function() {
				Zulu.gallery.toggleGallery();
			}, "false");
		},

		toggleGallery: function() {
			if (!this.is_created) {
				this.createGallery();
				this.is_created = true;

				document.addEventListener('keydown', function(e) {
					var used_keys = [37, 39];

					if (!Zulu.gallery.is_visible || used_keys.indexOf(e.keyCode) === -1)
						return;

					switch(e.keyCode) {
						case 37:
							Zulu.gallery.makeMeSuffer(Zulu.gallery.current_index - 1);
							break;
						case 39:
							Zulu.gallery.makeMeSuffer(Zulu.gallery.current_index + 1);
							break;
					}
					e.preventDefault();
				}, 'false');
			}

			if (this.is_visible) {
				this.dom.player.pause();

				this.dom.ctrl_btn.style.transform = 'rotate(0deg)';
				//this.dom.wrapper.style.display = 'none';
				$(this.dom.wrapper).fadeOut(200);
				this.is_visible = false;
			}
			else {
				this.dom.ctrl_btn.style.transform = 'rotate(45deg)';
				//this.dom.wrapper.style.display = 'block';
				$(this.dom.wrapper).fadeIn(200);
				this.is_visible = true;
			}
		},

		createGallery: function() {
			var thumbs = document.getElementsByClassName('thumb');

			var len = thumbs.length;
			for (var i = 0; i < len; ++i)
				this._addPreview(thumbs[i]);

			if (this.pics.length != 0)
				this.makeMeSuffer(0);
		},
		makeMeSuffer: function(id) {
			if (id < 0 || id >= this.pics.length)
				id = 0

			this.current_index = id;

			var th = document.getElementById('gallery-main');

			this.dom.player.pause();
			th.style.backgroundImage = 'none';

			if (this.pics[id].endsWith('.webm')) {
				this.dom.player.style.display = 'block';
				this.dom.player.src = this.pics[id];
				this.dom.player.play();
			}
			else {
				this.dom.ctrl_btn.className = 'loading';
				this.dom.player.style.display = 'none';

				this.preload_img.onload = function() {
					Zulu.gallery.dom.ctrl_btn.className = '';
					th.style.opacity = "0";
					th.style.backgroundImage = 'url("' + this.src + '")';
					$(th).animate({
						"opacity": '1.0'
					}, 300);
				}
				this.preload_img.src = this.pics[id];
			}

			this.dom.footer.scrollLeft = 200 * id - 40;
		},

		_addPreview: function(thumb_obj) {
			var preview_src = thumb_obj.src;
			var main_src = thumb_obj.parentNode.href;

			if (!preview_src || !main_src) return 1;

			if (this.pics.indexOf(main_src) != -1) return 2;

			var new_icon = document.createElement('a');
			new_icon.className = "gallery-preview";
			new_icon.id = this.pics.length;
			new_icon.style.backgroundImage = 'url("' + preview_src + '")';
			new_icon.href = main_src;

			var ext = main_src.match(/\w+$/)[0];
			var special_type = ["webm", "gif"].indexOf(ext);
			if (special_type != -1) {
				var type_lable = document.createElement('div');
				type_lable.className = 'type-preview';
				type_lable.innerHTML = ["webm", "gif"][special_type];
				new_icon.appendChild(type_lable);
			}

			new_icon.addEventListener('click', function(e) {
				var a = parseInt(this.id);
				Zulu.gallery.makeMeSuffer(a);
				e.preventDefault();
			}, 'false');

			this.dom.footer.appendChild(new_icon);
			this.pics.push(main_src);
		},

		_applyCustomCSS: function() {
			var custom_css = "#gallery-wrapper { \
				position: fixed; \
				z-index: 100; \
				top: 0; \
				right: 0; \
				bottom: 0; \
				left: 0; \
				min-height : 700px; \
				background-color: #000; \
			} \
			#gallery-player { \
				display: none; \
				height: 100%; \
				margin: auto; \
			} \
			#gallery-main { \
				position: absolute; \
				top: 0; \
				bottom: 200px; \
				width: 100%; \
				background-color: #000; \
				background-size: contain; \
				background-repeat: no-repeat; \
				background-position: center; \
			} \
			#gallery-footer { \
				position: absolute; \
				bottom: 0; \
				height: 200px; \
				width: 100%; \
				overflow-x: auto; \
				overflow-y: hidden; \
				white-space: nowrap; \
			} \
			.gallery-preview { \
				height: 200px; \
				width: 200px; \
				background-size: cover; \
				background-position: center; \
				display: inline-block; \
			} \
			.type-preview { \
				position: absolute; \
				cursor: normal; \
				width: 200px; \
				height: 2000px; \
				font-size: 2em; \
				color: #FFF; \
				text-shadow: 0 0 2px #000; \
				line-height: 150px; \
				text-align: center; \
			} \
			#gallery-ctrl-btn { \
				transition: 300ms; \
				position: fixed; \
				display: inline-block; \
				z-index: 101; \
				width: 50px; \
				height: 50px; \
				top: 40px; \
				right: 40px; \
			} \
			#gallery-ctrl-btn.loading { \
				animation: loading 300ms infinite linear; \
			} \
			@keyframes loading { \
				from {transform: rotate(0deg);} \
				to {transform: rotate(90deg);} \
			}";

			var gallery_css = document.createElement("style");
			gallery_css.id = "zulu-gallery_css";
			gallery_css.innerHTML = custom_css;

			document.head.appendChild(gallery_css);
		}
	},

	post: {
		init: function() {
			Zulu.posts = document.querySelectorAll('.post');
			this._calculateTimezoneOffset();
			this._fixAllDates();
		},

		patchDate: function(el) {
			if (!el) return 1;

			var label = el.querySelector('label');

			var date = label.innerHTML.
				match(/(\d+) (\w+) (\d+) \(\w+\) (\d+):(\d+)/);
			var old_date = date.shift();

			var date_dict = { "January": "Январь",
				"February": "Февраль",
				"March": "Март",
				"April": "Апрель",
				"May": "Май",
				"June": "Июнь",
				"July": "Июль",
				"August": "Август",
				"September": "Сентябрь",
				"October": "Октябрь",
				"November": "Ноябрь",
				"December": "Декабрь"
			}
			date[1] = date_dict[date[1]];

			var hours = parseInt(date[3]) - Zulu.board_tz + this.tz_offset;
			if (hours > 23)
				hours -= 24;

			date[3] = hours + ':' + date[4];
			var new_date = date[0] + "/" + date[1] + "/" + date[2] + " " + date[3];

			label.innerHTML = label.innerHTML.replace(old_date,
					'<label class="post-date">'+new_date+'</label>');
		},

		_calculateTimezoneOffset() {
			// calculates current timezone offset
			// e.g. UTC+6 returns 6
			// UTC-2 returns -2
			var d = new Date();
			var offset = d.getTimezoneOffset();
			offset /= -60;

			this.tz_offset = offset;
		},

		_fixAllDates: function() {
			var len = Zulu.posts.length;
			for (var i = 0; i < len; ++i) {
				this.patchDate(Zulu.posts[i]);
			}
		}
	}
};

window.addEventListener('DOMContentLoaded', Zulu.init(), 'false');
