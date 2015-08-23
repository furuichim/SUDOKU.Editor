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
                }    
                // set solver mode.
                this.find(".container").data("mode", "solver");
            }
            
            return this;
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
