//==========================================
//      Namespace and Vars
//==========================================


/** @constructor */
function Void() {
    this.ctype = 'void';
}
/** @constructor */
function CError(msg) {
    this.ctype = 'error';
    this.message = msg;
}

// Letters (Unicode 6.2.0 category L) in the basic multilingual plane
// (no surrogate pairs needed). Generated by tools/unicodeCat.js.
var bmpLetters = (function(d, s) {
    var i;
    var j = 0;
    var c = [];
    var n = s.length;
    for (i = 0; i < n; ++i)
        c[i] = j = d[s.charCodeAt(i) - 32] + j;
    var r = "";
    for (i = 0; i < n; i += 2) {
        r += String.fromCharCode(c[i]);
        if (c[i + 1] !== c[i])
            r += "-" + String.fromCharCode(c[i + 1]);
    }
    return r;
})([
    2, 0, 277, 3, 4, 6, 1, 5, 7, 10, 17, 22, 8, 9, 11, 15, 12, 13, 21, 25, 16,
    46, 18, 19, 30, 37, 40, 14, 24, 29, 36, 42, 52, 53, 26, 27, 28, 32, 35, 43,
    88, 20, 23, 33, 34, 38, 47, 48, 49, 51, 56, 59, 63, 65, 68, 69, 102, 117,
    31, 39, 268, 41, 45, 50, 54, 55, 57, 64, 66, 72, 73, 74, 75, 78, 81, 82, 83,
    84, 85, 87, 89, 93, 94, 98, 105, 107, 108, 116, 130, 132, 134, 138, 146,
    157, 191, 332, 362, 365, 457, 470, 513, 619, 1164, 2684, 6581, 8453, 11171,
    20940
], ("U3(3O!.!'!%+ 8 \x82'./$,! !x$ &##-!   ! 7 k {-})9#!,MfB% 5?>& s !4&,&. " +
    "#!*! =8H0!3E)&'!%2'!)!$!<<e! )HA$!7!,-4% %%(#&#2 % !$#$!*!;&  /&I''&#2 " +
    "% & & &E# !I *,   2 % & $$!7!4&>(#&#2 % & $$!Z&  4!6! '$  #$& ! &$&$ $." +
    "J!A(   + - $$!C&(&>(   + - $$!K! &4&7(   :#!*!6&3'%*$J , !#%SN &1%S& !#" +
    "& !#!(# %   ! !#& # &)!#$ !+#K!c( FD$w?2!*''#$!$&, '01!69 !%!#? \x7f ##" +
    "% ! ##: ##E ##% ! ##; R ##dM/*m1\x85#4 3%g+0 #/*/*/0  4Q>!'!Vo-: !%W.D@" +
    "=#$0G+%b+)@l!r56%R=;&.GCF? .Fv# #$&)~U\"#'#9#'#( ! ! ! 8#@ % !$  %$##''" +
    "0%  %Y!;!*0X!'!#- !$$(! ! ! # )##%$'!A&\x875 5 y(#$&19 !%!#a,!*+)% % % " +
    "% % % % %j!\x83&G$%&'n(  p #%:$q6B`/\x84\x88h\x8b@\x86V^#\\$/.&25*<-W_," +
    "#X## #1)i-   # +8Q/PT'$!/C.+BD,5=!P:<  (2+$!%N !$&#$#! !3 #), 1'#'#')% " +
    "%|L8\x8a1+'O\x89\x81#t[%1$%! - 0 $ ! & & uL\x807T#A].Y$ z93(30H$'#'#'# "));

var reVarName = new RegExp(
    "^(?:#[1-9]?|[0-9'" + bmpLetters + "]+)$");

var namespace = {};

// Initialize preset variables
namespace.vars = (function() {
    var preset = {
        pi: CSNumber.real(Math.PI),
        i: CSNumber.complex(0, 1),
        'true': General.bool(true),
        'false': General.bool(false),
        '#': nada,
    };
    var vars = [];
    for (var name in preset)
        vars[name] = {
            ctype: 'variable',
            name: name,
            stack: [preset[name]]
        };
    return vars;
})();

namespace.isVariable = function(a) {
    return this.vars.hasOwnProperty(a);
};

namespace.isVariableName = function(a) {
    return reVarName.test(a);
};

namespace.create = function(code) {
    var v = {
        'ctype': 'variable',
        'stack': [null],
        'name': code
    };
    this.vars[code] = v;
    return v;
};

namespace.newvar = function(code) {
    var v = this.vars[code];
    v.stack.push(nada); // nada not null for deeper levels
    return v;
};

namespace.removevar = function(code) {
    var stack = this.vars[code].stack;
    if (stack.length === 0) console.error("Removing non-existing " + code);
    stack.pop();
    if (stack.length === 0) console.warn("Removing last " + code);
};


namespace.setvar = function(code, val) {
    var stack = this.vars[code].stack;
    if (stack.length === 0) console.error("Setting non-existing variable " + code);
    if (val === undefined) {
        console.error("Setting variable " + code + " to undefined value");
        val = nada;
    }
    if (val.ctype === 'undefined') {
        stack[stack.length - 1] = val;
        return;
    }
    var erg = val;
    if (erg === null) erg = nada; // explicit setting does lift unset state
    stack[stack.length - 1] = erg;
};

namespace.undefinedWarning = {};

namespace.getvar = function(code) {

    var stack = this.vars[code].stack;
    if (stack.length === 0) console.error("Getting non-existing variable " + code);
    var erg = stack[stack.length - 1];
    if (erg === null) {
        if (csgeo.csnames.hasOwnProperty(code)) {
            return {
                'ctype': 'geo',
                'value': csgeo.csnames[code]
            };
        } else {
            if (console && console.log && this.undefinedWarning[code] === undefined) {
                this.undefinedWarning[code] = true;
                console.log("Warning: Accessing undefined variable: " + code);
            }
        }
        return nada;
    }
    return erg;
};

namespace.dump = function(code) {
    var stack = this.vars[code].stack;
    console.log("*** Dump " + code);

    for (var i = 0; i < stack.length; i++) {
        console.log(i + ":> " + niceprint(stack[i]));
    }
};

namespace.vstack = [];

namespace.pushVstack = function(v) {
    this.vstack.push(v);

};
namespace.popVstack = function() {
    this.vstack.pop();
};

namespace.cleanVstack = function() {
    var st = this.vstack;
    while (st.length > 0 && st[st.length - 1] !== "*") {
        this.removevar(st[st.length - 1]);
        st.pop();
    }
    if (st.length > 0) {
        st.pop();
    }
};
