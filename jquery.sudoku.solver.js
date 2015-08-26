(function(){
    // same column groups : [column, row]
    var gc = [
        [[0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8]],
        [[1,0],[1,1],[1,2],[1,3],[1,4],[1,5],[1,6],[1,7],[1,8]],
        [[2,0],[2,1],[2,2],[2,3],[2,4],[2,5],[2,6],[2,7],[2,8]],
        [[3,0],[3,1],[3,2],[3,3],[3,4],[3,5],[3,6],[3,7],[3,8]],
        [[4,0],[4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[4,8]],
        [[5,0],[5,1],[5,2],[5,3],[5,4],[5,5],[5,6],[5,7],[5,8]],
        [[6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],[6,7],[6,8]],
        [[7,0],[7,1],[7,2],[7,3],[7,4],[7,5],[7,6],[7,7],[7,8]],
        [[8,0],[8,1],[8,2],[8,3],[8,4],[8,5],[8,6],[8,7],[8,8]]
    ],
    // same row groups : [column, row]
    gr = [ 
        [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0]],
        [[0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1]],
        [[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2]],
        [[0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3]],
        [[0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4]],
        [[0,5],[1,5],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5]],
        [[0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6]],
        [[0,7],[1,7],[2,7],[3,7],[4,7],[5,7],[6,7],[7,7],[8,7]],
        [[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,8],[7,8],[8,8]]
    ],
    // same region groups : [column, row]
    gg = [
        [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]],
        [[3,0],[4,0],[5,0],[3,1],[4,1],[5,1],[3,2],[4,2],[5,2]],
        [[6,0],[7,0],[8,0],[6,1],[7,1],[8,1],[6,2],[7,2],[8,2]],
        [[0,3],[1,3],[2,3],[0,4],[1,4],[2,4],[0,5],[1,5],[2,5]],
        [[3,3],[4,3],[5,3],[3,4],[4,4],[5,4],[3,5],[4,5],[5,5]],
        [[6,3],[7,3],[8,3],[6,4],[7,4],[8,4],[6,5],[7,5],[8,5]],
        [[0,6],[1,6],[2,6],[0,7],[1,7],[2,7],[0,8],[1,8],[2,8]],
        [[3,6],[4,6],[5,6],[3,7],[4,7],[5,7],[3,8],[4,8],[5,8]],
        [[6,6],[7,6],[8,6],[6,7],[7,7],[8,7],[6,8],[7,8],[8,8]]
    ],
    // entire groups which include 'same column groups', &same row groups' 
    // and 'same region groups'.
    entireGroups = gc.concat(gr, gg),
    // function to get the index of same region groups where the cell belongs.
    ggIndex = function(c, r) {
        return parseInt(r / 3) * 3 + parseInt(c / 3);
    },
    // call the specified callback for all the cells, of which flag match 
    // one of the flags specifed by the parameter.
    forAll = function(sudoku, flags, callback) {
        for (var r = 0; r < 9; ++ r) {
	        for (var c = 0; c < 9; ++ c) {
                var isTarget = false;
                for (var i in flags) {
                    if (sudoku.flags[c][r] == flags[i]) {
                        isTarget = true;
                    }
                }
                if (isTarget) {
                    if (callback.call(sudoku, c, r) == false) {
                        return;
                    }
                }
            }
        }
    },
    // function to get the count of the cells whose flags match the one of
    // the flags  specifed by the parameter.
    countOf = function(sudoku, flags) {
        var count = 0;
        forAll(sudoku, flags, function(c, r) {++ count;});
        return count;
    },
    // enum values for the cells state.
    STATE = {
        unsolved:0,
        initial:1,
        solved:2,
        assuming:3
    },
    // Default maximum number of the searched answers.
    DEFAULT_MAX_SEARCH_COUNT = 20;

    // Sudoku class constructor
    window.Sudoku = function() {
        this.cells = [];
        this.candidates = [];
        this.flags = [];
        this.init();
    };
    Sudoku.prototype.init = function() {
        for (var c = 0; c < 9; ++ c) {
            this.cells[c] = [];
            this.candidates[c] = [];
            this.flags[c] = []
            for (var r = 0; r < 9; ++ r) {
                this.cells[c][r] = 0;
                this.candidates[c][r] = 0x1ff;
                this.flags[c][r] = STATE.unsolved;
            }
        }
        return this;
    };
    Sudoku.prototype.load = function(data) {
        var dd = data.split("-");
        this.init();
        for (var i = 0; i < 2 && dd[i] != undefined; ++ i) {
            d = dd[i].match(/[1-9]{3}/g);
            for (var j in d) {
                var c = parseInt(d[j].charAt(0)) - 1,
                    r = parseInt(d[j].charAt(1)) - 1,
                    v = parseInt(d[j].charAt(2));
                this.cells[c][r] = v;
                this.candidates[c][r] = 1 << (v - 1);
                this.flags[c][r] = i == 0 ? STATE.initial : STATE.solved;
            }
        }
        this.narrow();
        return this;
    };
    Sudoku.prototype.save = function() {
        var initial = "", solved = "";
        forAll(this, [STATE.initial, STATE.solved, STATE.assuming], function(c, r) {
            if (this.flags[c][r] == STATE.initial) {
                initial += (c + 1).toString() + (r + 1).toString() + this.cells[c][r];
            } else {
                solved += (c + 1).toString() + (r + 1).toString() + this.cells[c][r];
            }
        });
        return solved != "" ? (initial + "-" + solved) : initial;
    };
    Sudoku.prototype.verify = function() {
        for (var i in entireGroups) {
            var all = 0, fixed = 0;
            for (var j in entireGroups[i]) {
                var c = entireGroups[i][j][0], r = entireGroups[i][j][1];
                if (this.flags[c][r] != STATE.unsolved) {
                    if ((fixed & this.candidates[c][r]) == 0) {
                        fixed |= this.candidates[c][r];
                    } else {
                        return false;
                    }
                }
                all |= this.candidates[c][r];
            }
            if (all != 0x1ff) {
                return false;
            }
        }
        return true;
    };
    Sudoku.prototype.isNoAnswers = function() {
        var noAnswer = false;
        forAll(this, [STATE.unsolved], function(c, r) {
            if (this.candidates[c][r] == 0) {
                noAnswer = true;
                return false;
            }
        });
        return noAnswer;
    };
    Sudoku.prototype.narrow = function() {
            var isNarrowed, _self = this,
            // 確定済みの値でグループの未確定要素の候補を排他する
            _exclude = function(group, mask) {
                for (var i in group) {
                    var c = group[i][0], r = group[i][1], masked = _self.candidates[c][r];
                    if (_self.flags[c][r] == STATE.unsolved) {
                        masked &= ~mask;
                        if (masked != _self.candidates[c][r]) {
                            _self.candidates[c][r] = masked;
                        }
                    }
                }
            },
            // 全要素の候補に対して、確定しているセルの値を排他する
            _excludeAll = function() {
                forAll(_self, [STATE.initial, STATE.solved, STATE.assuming], function(c, r) {
                    _exclude(gc[c], _self.candidates[c][r]);
                    _exclude(gr[r], _self.candidates[c][r]);
                    _exclude(gg[ggIndex(c, r)], _self.candidates[c][r]);
                });
            },
            // 指定されたグループの自分以外の要素の候補を論理和をとる
            _orWithoutMe = function(group, me) {
                var result = 0;
                for (var i in group) {
                    var c = group[i][0], r = group[i][1];
                    if ((_self.flags[c][r] == STATE.unsolved) && !((me[0] == c) && (me[1] == r))) {
                        result |= _self.candidates[c][r];
                    }
                }
                return result;
            };

        // 確定している要素で、候補の排他を行う。
        _excludeAll();

        // ナロー出来る限り繰り返す
        do {
            isNarrowed = false;

            // 全要素の候補に対して、グループ毎に唯一の候補があるかチェックする
            forAll(this, [STATE.unsolved], function(c, r) {
                var groups = [gc[c], gr[r], gg[ggIndex(c, r)]];
                for (var i in groups) {
                    var others = _orWithoutMe(groups[i], [c, r]),
                        only = (others ^ this.candidates[c][r]) & ~others;
                    if (only != 0 && only.toString(2).replace(/0/g, "").length == 1) {
                        this.candidates[c][r] = only;
                        this.cells[c][r] = only.toString(2).length - only.toString(2).indexOf("1");
                        this.flags[c][r] = STATE.solved;
                        isNarrowed = true;

                        // 1要素が確定したので、全体を排他する
                        _excludeAll();
                        break;
                    }
                }
            });
        } while (isNarrowed);

        return true;
    };
    Sudoku.prototype.solve = function(count) {

        count = count || DEFAULT_MAX_SEARCH_COUNT;
        if (count <= 0) {
            return null;
        }

        // If the question has less than 17 hits, there is NO answer.
        // This had been proved mathematically. 
        if (countOf(this, [1]) <= 16) {
            console.log("This question CANNOT be solved.");
        }

        // Try to solve by the reguler method.
        this.narrow();

        // check if there is a answer at this point.
        if (this.isNoAnswers()) {
            // Due to the wrong assumption, there is no answer.
            return;
        }

        if (countOf(this, [STATE.initial, STATE.solved, STATE.assuming]) < 81) {
            var checkPoint = this.save(), c, r, candidates, answers = [];

            forAll(this, [STATE.unsolved], function(cc, rr) {
                c = cc;
                r = rr;
                candidates = this.candidates[c][r];
                return false;
            });

            for (var i = 0; (i < 9) && (count > 0); ++ i) {
                if ((1 << i) & candidates) {
                    // ASSUMING...
                    console.log("[" + c + "][" + r + "]:" + candidates.toString(2) + "-->" + (i + 1));
                    this.flags[c][r] = STATE.assuming;   // assuming...
                    this.candidates[c][r] = (1 << i);
                    this.cells[c][r] = i + 1;

                    // verify if this assumption is correct.
                    var result = this.solve(count);
                    if (result) {
                        // correct assumption, merge answers to result.
                        answers = answers.concat(result);
                        count -= result.length;
                    }

                    // restore the state
                    this.load(checkPoint);
                }
            }

            return answers;
        } else {
            // At this point, all the cells are solved. 
            // However the answer could be wrong, so we must verify the answer.
            if (this.verify()) {
                console.log(this.save());
                return [this.save()]; 
            } else {
                return null;
            }
        }
    };
    Sudoku.prototype.dump = function() {
        for (var r = 0; r < 9; ++ r) {
            for (var c = 0; c < 9; ++ c) {
                console.log("[" + c + "][" + r + "]:" + this.flags[c][r] + ":" + this.candidates[c][r].toString(2));
            }
        }
        return this;
    };
})();
