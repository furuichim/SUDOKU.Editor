(function($){
    var _methods = {
        init: function(option, data) {

            // Calcurate the size of a cell and a container.
            var _self = this,
                parentSize = Math.min(this.innerWidth(), this.innerHeight()),
                cellSize = Math.floor(parentSize / 9) - 2,
                size = cellSize * 9 + 8 + 6,
                $container, $controller;

            // Create a container in the specified elemnet, then create cells in the container.
            // each cell has three classes, cX, rX and gX, first two of which indicate column and row position,
            // and rest of which indicates a rect group.
            this.empty();
            $container = $("<div/>").addClass("container").width(size).height(size).appendTo(this);
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
                            if ($container.data("mode") == "creator") {
                                $(this).data("sudoku", (1 << (parseInt(v) - 1))).addClass("initial").html(v);
                            } else {
                                $(this).data("sudoku", (1 << (parseInt(v) - 1))).addClass("solved").html(v);
                            }
                            _methods.narrow.call(_self);
                        })
                        .appendTo($container);
                }
            }
            // add procedures on each cell in sudoku.
            $container.on("mousedown", ".digit:not(.initial)", function() {
                $container.find(".digit.selected").removeClass("selected");
                $(this).addClass("selected");
                $controller.triggerHandler("refresh", [$(this).data("sudoku")]);
            }).on("click", ".digit.initial", function() {
                if ($container.data("mode") == "creator") {
                    $container.find(".digit.selected").removeClass("selected");
                    $(this).removeClass("initial").addClass("selected").html("");
                    $container.find(".digit:not(.initial)").data("sudoku", 0x1ff);
                    _methods.narrow.call(_self);
                    $controller.triggerHandler("refresh", [$(this).data("sudoku")]);
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
            }).on("refresh", function(e, mask) {
                $(this).find(".key").removeClass("disabled");
                for (var i = 0; i < 10; ++ i) {
                    if (((1 << i) & mask) == 0) {
                        $(this).find(".key:contains(" + (i + 1) + ")").addClass("disabled");
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
        clear: function() {
            this.find(".digit").removeClass("initial solved assumed selected").data("sudoku", 0x1ff).html("");
            this.find(".container").data("mode", "creator");
            return this;
        },
        load: function(data) {
            console.log("loading from " + data);
            var _self = this, classesName = ["initial", "solved"];

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
                    _methods.narrow.call(this);
                    console.log("successfully loaded.");
                }
    
                // set solver mode.
                this.find(".container").data("mode", "solver");
            }
            
            return this;
        },
        save: function(data) {
            var _self = this, data = ["", ""];

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
            console.log("saved to " + data[0] + "-" + data[1]);
            return data[1] == "" ? data[0] : (data[0] + "-" + data[1]);
        },
        verify: function() {
            var _self = this,
                isValid = true,
                groups = ["c1","c2","c3","c4","c5","c6","c7","c8","c9","r1","r2","r3","r4","r5","r6","r7","r8","r9","g1","g2","g3","g4","g5","g6","g7","g8","g9"];            $.each(groups, function(i, g) {
                var test = {};
                _self.find(".digit."+g).each(function() {
                    if ($(this).html() != "") {
                        if (test[$(this).html()] !== undefined) {
                            isValid = false;
                            return false;
                        } else {
                            test[$(this).html()]    = true;
                        }
                    }
                });
                if (!isValid) {
                    // the data is invalid, so quit verifing.
                    return false;
                }
            });
            return isValid;
        },
        isNoAnswers: function() {
            var noAnswer = false;
            this.find(".digit:not(.initial)").each(function() {
                if ($(this).data("sudoku") == 0) {
                    noAnswer = true;
                    return false;
                }
            });
            return noAnswer;
        },
        narrow: function() {
            var _self = this,
                isNarrowed = false,
                groups = ["c1","c2","c3","c4","c5","c6","c7","c8","c9","r1","r2","r3","r4","r5","r6","r7","r8","r9","g1","g2","g3","g4","g5","g6","g7","g8","g9"];

            $.each(groups, function(i, g) {
                //console.debug("["+g+"]")
                _self.find(".digit."+g).filter(".initial, .solved").each(function() {
                    var mask = ~$(this).data("sudoku");
                    //console.debug($(this).html());
                    _self.find(".digit:not(.initial):not(.solved)."+g).each(function() {
                        var org = $(this).data("sudoku"),
                            narrowed = org & mask;
                        if (org != narrowed) {
                            //console.debug(this.getAttribute("class") + ":" + org + ">" + narrowed);
                            $(this).data("sudoku", narrowed);
                            isNarrowed = true;
                        }
                    });
                });
            });
            _self.find(".digit:not(.initial):not(.solved)").each(function() {
                var classes = this.getAttribute("class"),
                    c = classes.match(/c[0-9]/)[0],
                    r = classes.match(/r[0-9]/)[0],
                    g = classes.match(/g[0-9]/)[0],
                    p = $(this).data("sudoku"),
                    $target = $(this);
                $.each([c,r,g], function(i, group) {
                    var others = 0;
                    _self.find(".digit:not(.initial):not(.solved)." + group).not("."+c+"."+r).each(function(){
                        others |= $(this).data("sudoku");
                    });
                    for (var i = 0; i < 10; ++ i) {
                        var test = (1 << i);
                        if (((test & p) == test) && ((test & others) == 0)) {
                            //console.info("ok");
                            $target.data("sudoku", test);
                            isNarrowed = true;
                            return false;
                        }
                    }
                }); 
            });
            return isNarrowed;
        },
        solve: function() {
            var _self = this;

            // If the question has less than 17 hits, there is NO answer.
            // This had been proved mathematically. 
            if (_self.find(".digit.initial").length <= 16) {
                console.error("There is no answer.");
                return false;
            }

            // Try to solve by the reguler method.
            while (_methods.narrow.call(this)) {
                // fix value at the cell which has single candidate.
                _self.find(".digit:not(.initial):not(.solved)").each(function() {
                    var data = $(this).data("sudoku"), i;
                    for (var i = 0; i < 10; ++ i) {
                        if ((1 << i) == data) {
                            $(this).addClass("solved").html(i + 1);
                        }
                    }
                });
            }

            // check if there is a answer at this point.
            if (_methods.isNoAnswers.call(this)) {
                // Due to the wrong assumption, there is no answer.
                return;
            }

            // Try to solve by the assuming method.
            if (this.find(".digit.initial, .digit.solved").length < 81) {
                var checkPoint = _methods.save.call(this),
                    _target = _self.find(".digit:not(.initial):not(.solved):not(.assumed):first"),
                    candidates = _target.data("sudoku"),
                    answers = [],
                    result;

                for (var i = 0; i < 10; ++ i) {
                    if ((1 << i) & candidates) {
                        // ASSUMING...
                        console.log("assumeding:" + _target[0].getAttribute("class") + ":" + candidates.toString(2) + ">>>" + (i + 1));   
                        _target.addClass("solved").addClass("assumed").data("sudoku", (1 << i)).html(i + 1);

                        // verify if this assumption is correct.
                        result = _methods.solve.call(this);
                        if (!result) {
                            // wrong assumption, restore to the checkpoint and examin another assumptions.
                            _methods.load.call(this, checkPoint);
                        } else {
                            // correct assumption, merge answers to result.
                            $.merge(answers, result);
                        }
                    }
                }
                return answers;
            }

            // At this point, all the cells are solved. 
            // However the answer could be wrong, so we must verify the answer.
            if (_methods.verify.call(this)) {
                return [_methods.save.call(this)]; 
            } else {
                return null;
            }
        },
        dump: function() {
            console.log("------[DUMP]------")
            this.find(".digit").each(function() {
                console.log(this.getAttribute("class") + ":" + $(this).data("sudoku").toString(2));
            });
            console.log("------------------")
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
