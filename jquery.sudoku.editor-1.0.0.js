/**
 * @fileOverview SUDOKU SOLVER ENGINE
 * @author Masahiro Furuichi
 * @requires jquery.js
 * @since 2015
 * @version 1.0.0
 */
(function($){
    var _methods = {
        init: function(data) {

            // Calcurate the size of a cell and a container.
            var _self = this,
//                parentSize = Math.min(this.innerWidth(), this.innerHeight()),
                parentSize = this.innerWidth(),
                cellSize = Math.floor(parentSize / 9) - 2,
                size = cellSize * 9 + 8 + 6,
                $container, $controller;

            // Create a container in the specified elemnet, then create cells in the container.
            // each cell has three classes, cX, rX and gX, first two of which indicate column and row position,
            // and rest of which indicates a rect group.
            this.empty();
            $container = $("<div/>").addClass("container").width(size).height(size).appendTo(this).data("option", {support:true});
            for (var r = 1; r < 10; ++ r) {
                for (var c = 1; c < 10; ++ c) {
                    $("<div class='digit'/>")
                        .addClass("c" + c)      // column indicator class
                        .addClass("r" + r)      // row indicator class
                        .addClass("g" + (Math.floor((r - 1) / 3) * 3 + Math.floor((c - 1) / 3) + 1))
                        .css({
                            "width":cellSize + "px",
                            "height":cellSize + "px",
                            "font-size":cellSize + "px",
                            "line-height":cellSize + "px"
                        })
                        .on("input", function(e, v) {
                            if ($(this).html() == v) {
                                $(this).removeClass("initial, solved").html("");
                            } else {
                                $(this).data("sudoku", (1 << (parseInt(v) - 1))).html(v);
                                if ($container.data("mode") == "creator") {
                                    $(this).addClass("initial");
                                } else {
                                    $(this).addClass("solved");
                                    if ($container.find(".initial, .solved").length == 81) {
                                        if (_methods.verify.call(_self)) {
                                            alert("Congratulations!!!");
                                        }
                                    }
                                }
                            }
                            _methods.exclude.call(_self);
                        })
                        .appendTo($container);
                }
            }
            // add procedures on each cell in sudoku.
            $container.on("mousedown", ".digit:not(.initial)", function() {
                $container.find(".digit.selected").removeClass("selected");
                $(this).addClass("selected").removeClass("solved");
                _methods.exclude.call(_self);
                $controller.triggerHandler("refresh");
            }).on("mousedown", ".digit.initial", function() {
                if ($container.data("mode") == "creator") {
                    $container.find(".digit.selected").removeClass("selected");
                    $(this).removeClass("initial").addClass("selected");
                    _methods.exclude.call(_self);
                    $controller.triggerHandler("refresh");
                }
            });
            $(document).on("keydown", function(e) {
                if ((e.which >= 0x25) && (e.which <= 0x28)) {
                    var classes = $container.find(".digit.selected")[0].getAttribute("class"),
                        c = classes.match(/c[0-9]/)[0].charAt(1),
                        r = classes.match(/r[0-9]/)[0].charAt(1),
                        mode = $container.data("mode");
                    switch(e.which) {
                        case 0x28:	// VK_DOWN
                            do {
                                if (r != 9) ++ r;
                            } while ((r != 9) && (mode == "solver") && $container.find(".digit.c" + c + ".r" + r).hasClass("initial"));
                            break;
                        case 0x26:  // VK_UP
                            do {
                                if (r != 1) -- r;
                            } while ((r != 1) && (mode == "solver") && $container.find(".digit.c" + c + ".r" + r).hasClass("initial"));
                            break;
                        case 0x25:	// VK_LEFT
                            do {
                                if (c != 1) -- c;
                            } while ((c != 1) && (mode == "solver") && $container.find(".digit.c" + c + ".r" + r).hasClass("initial"));
                            break;
                        case 0x27:	// VK_RIGHT
                            do {
                                if (c != 9) ++ c;
                            } while ((c != 9) && (mode == "solver") && $container.find(".digit.c" + c + ".r" + r).hasClass("initial"));
                            break;
                    }
                    $container.find(".digit.c" + c + ".r" + r).trigger("mousedown");
                    e.preventDefault();
                } else if ((e.which >= 0x31) && (e.which <= 0x39)) {
                    $controller.find(".key:contains(" + (e.which - 0x30) + ")").trigger("mousedown");
                }
            });

            // Create a input controller
            $controller = $("<div/>").addClass("controller").width(size).height(cellSize+4).appendTo(this);
            for (var c = 1; c < 10; ++ c) {
                $("<div class='key r1'/>")
                    .addClass("c" + c)
                    .css({
                        "width":cellSize + "px",
                        "height":cellSize + "px",
                        "font-size":cellSize + "px",
                        "line-height":cellSize + "px"
                    })
                    .html(c)
                    .appendTo($controller);
            }

            // add procedures on a input controller.
            $controller.on("mousedown", ".key:not(.disabled)", function() {
                $container.find(".selected").triggerHandler("input", [$(this).html()]);
            }).on("refresh", function(e) {
                $(this).find(".key").removeClass("disabled");
                if ($container.data("option").support == true) {
                    var mask = $container.find(".digit.selected").data("sudoku");
                    for (var i = 0; i < 10; ++ i) {
                        if (((1 << i) & mask) == 0) {
                            $(this).find(".key:contains(" + (i + 1) + ")").addClass("disabled");
                        }
                    }
                }
            });

            // If the data is spacified, we load it.
            if (typeof(data) === "string" && data.length > 2) {
                _methods.load.call(this, data);
            } else {
                _methods.clear.call(this);
            }
            return this;
        },
        option: function(opt) {
            this.find(".container").data("option", opt);
            this.find(".controller").triggerHandler("refresh");
            return this;
        },
        clear: function() {
            this.find(".digit").removeClass("initial solved assumed selected").data("sudoku", 0x1ff).html("");
            this.find(".container").data("mode", "creator");
            this.find(".controller").triggerHandler("refresh");
            return this;
        },
        reset: function() {
            if (this.find(".container").data("mode") == "solver") {
                this.find(".digit:not(.initial)").removeClass("solved assumed selected").data("sudoku", 0x1ff).html("");
                this.find(".controller").triggerHandler("refresh");
            }
            return this;
        },
        isValidData: function(data) {
            return /^([1-9]{3}){17,}$/.test(data) || /^([1-9]{3}){17,}-([1-9]{3}){1,81}$/.test(data);
        },
        load: function(data) {
            console.log("loading from " + data);
            var _self = this, classesName = ["initial", "solved"];

            if (!_methods.isValidData.call(this, data)) {
                return this;
            }

            // clear previous data at first.
            _methods.clear.call(this);

            if (data && data.length > 2) {
                // set initial datas at first, then set solved data.
                $.each(data.split("-"), function(i, dd) {
                    if (dd.length > 0) {
                        $.each(dd.match(/[1-9]{3}/g), function(j, d) {
                            var c = d.charAt(0),
                                r = d.charAt(1),
                                v = d.charAt(2);
                            _self.find(".digit.c" + c + ".r" + r).addClass(classesName[i]).data("sudoku", 1 << (parseInt(v) - 1)).html(v);
                        });
                    }
                });

                // verify data
                if (!_methods.verify.call(this)) {
                    console.error("INVALID DATA");
                } else {
                    _methods.exclude.call(this);
                    console.log("successfully loaded.");
                }

                // set solver mode.
                this.find(".container").data("mode", "solver");
            }
            
            return this;
        },
        save: function(data) {
            var _self = this, data = ["", ""], ret;
            // serialize initial datas at first, then serialize solved data.
            $.each([".initial", ".solved"], function(i, cat) {
                _self.find(".digit"+cat).each(function() {
                    var classes = this.getAttribute("class"),
                        c = classes.match(/c[0-9]/)[0].charAt(1),
                        r = classes.match(/r[0-9]/)[0].charAt(1),
                        v = $(this).html();
                    data[i] += c + r + v;
                });
            });
            ret = (data[1] != "") ? (data[0] + "-" + data[1]) : data[0];
            console.log("saved to " + ret);
            return ret;
        },
        verify: function() {
            var _self = this,
                isValid = true,
                groups = ["c1","c2","c3","c4","c5","c6","c7","c8","c9","r1","r2","r3","r4","r5","r6","r7","r8","r9","g1","g2","g3","g4","g5","g6","g7","g8","g9"];
            
            $.each(groups, function(i, g) {
                var all = 0, fixed = 0;
                _self.find(".digit."+g).each(function() {
                    if ($(this).hasClass("initial") || $(this).hasClass("solved")) {
                        if ((fixed & $(this).data("sudoku")) == 0) {
                            fixed |= $(this).data("sudoku");
                        } else {
                            isValid = false;
                            return false;
                        }
                    }
                	all |= $(this).data("sudoku");
                });
                if (!isValid || all != 0x1ff) {
                    isValid = false;
                    return false;
                }
            });
            return isValid;
        },
        exclude: function() {
            var _self = this,
                groups = ["c1","c2","c3","c4","c5","c6","c7","c8","c9","r1","r2","r3","r4","r5","r6","r7","r8","r9","g1","g2","g3","g4","g5","g6","g7","g8","g9"];

            _self.find(".digit:not(.initial):not(.solved)").data("sudoku", 0x1ff);
            $.each(groups, function(i, g) {
                _self.find(".digit."+g).filter(".initial, .solved").each(function() {
                    var mask = ~$(this).data("sudoku");
                    _self.find(".digit:not(.initial):not(.solved)."+g).each(function() {
                        var org = $(this).data("sudoku"),
                            narrowed = org & mask;
                        if (org != narrowed) {
                            $(this).data("sudoku", narrowed);
                        }
                    });
                });
            });
            return this;
        }
    };

    $.fn.sudoku = function(params) {
        if (_methods[params]) {
            return _methods[params].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof (params) === 'object' || !params) {
            return _methods.init.apply(this, arguments);
        } else {
            $.error(_systemMessages.notSupportMethod + params);
        }
    };

})(jQuery);
