// ==UserScript==
// @name        Zulu
// @namespace   dot.noisu
// @include     http://dobrochan.com/*
// @version     1
// @grant       none
// ==/UserScript==

var Zulu = {
	posts: [],
	board_tz: 3, // board's UTC timezone

	init: function() {
		this.page.init();
		this.post.init();
		this.reply.init();
	},

	page: {
		isThread: false, // should be true if in a thread
		board: null, // board name string b, slow etc.
		thread: null, // thread name string eg. 25005

		init: function() {
			this._parseURL();
			$('head').append('<style id="zulu-css"></style>');
		},

		applyCSS: function(obj) {
			if (!obj || obj.length < 1)
				return 1;

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

			if (!ary || ary.length === 0)
				return 1;

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
			if (!post_id || !reply_id)
				return 0;
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

		_processReplies() {
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

	post: {
		init: function() {
			Zulu.posts = document.querySelectorAll('.post');
			this._calculateTimezoneOffset();
			this._fixAllDates();
		},

		patchDate: function(el) {
			if (!el)
				return 1;

			var label = el.querySelector('label');

			var date = label.innerHTML.
				match(/(\d+) (\w+) (\d+) \(\w+\) (\d+):(\d+)/);
			var old_date = date.shift();

			var date_dict = { "January": "Января",
				"February": "Февраля",
				"March": "Марта",
				"April": "Апреля",
				"May": "Мая",
				"June": "Июня",
				"July": "Июля",
				"August": "Августа",
				"September": "Сентября",
				"October": "Октября",
				"November": "Ноября",
				"December": "Декабря"
			}
			date[1] = date_dict[date[1]];

			var hours = parseInt(date[3]) - Zulu.board_tz + this.tz_offset;
			if (hours > 23)
				hours -= 24;

			date[3] = hours + ':' + date[4];
			date.pop();

			var new_date = date.join(" ");

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
