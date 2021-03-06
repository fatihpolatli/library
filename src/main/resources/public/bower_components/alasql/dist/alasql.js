/*! AlaSQL v0.2.1 © 2014-2015 Andrey Gershun & M. Rangel Wulff | alasql.org/license */
/*
@module alasql
@version 0.2.1

AlaSQL - JavaScript SQL database
© 2014-2015	Andrey Gershun & M. Rangel Wulff


@license
The MIT License (MIT)

Copyright © 2014-2015 Andrey Gershun (agershun@gmail.com) & M. Rangel Wulff (m@rawu.dk) 

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/**
	@fileoverview AlaSQL JavaScript SQL library
	@see http://github.com/agershun/alasql
*/

/**
	Callback from statement
	@callback statement-callback
	@param {object} data Result data
*/

/**
	UMD envelope for AlaSQL
*/

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof exports === 'object') {
    	/** alasql main function */
        module.exports = factory();
    } else {
        root.alasql = factory();
    }
}(this, function () {

/**
	AlaSQL - Main Alasql class
 	@function
 	@param {string|function|object} sql - SQL-statement or data object for fuent interface
 	@param {object} params - SQL parameters
 	@param {function} cb - callback function
 	@param {object} scope - Scope for nested queries
 	@return {any} - Result data object

	@example
 Standard sync call:
    alasql('CREATE TABLE one');
 Query:
 	var res = alasql('SELECT * FROM one');
 Call with parameters:
 	var res = alasql('SELECT * FROM ?',[data]);
 Standard async call with callback function:
 	alasql('SELECT * FROM ?',[data],function(res){
		console.log(data);
 	});
 Call with scope for subquery (to pass common values):
    var scope = {one:{a:2,b;20}}
    alasql('SELECT * FROM ? two WHERE two.a = one.a',[data],null,scope);
 Call for fluent interface with data object:
    alasql(data).Where(function(x){return x.a == 10}).exec();
 Call for fluent interface without data object:
    alasql().From(data).Where(function(x){return x.a == 10}).exec();
 */

var alasql = function alasql(sql, params, cb, scope) {
	if(typeof importScripts !== 'function' && alasql.webworker) {
		var id = alasql.lastid++;
		alasql.buffer[id] = cb;
		alasql.webworker.postMessage({id:id,sql:sql,params:params});
	} else {
		if(arguments.length === 0) {
			// Without arguments - Fluent interface
			return new yy.Select({
				columns:[new yy.Column({columnid:'*'})],
				from: [new yy.ParamValue({param:0})]
			});
		} else if (arguments.length === 1 && typeof sql === "object" && sql instanceof Array) {
			// One argument data object - fluent interface
				var select = new yy.Select({
					columns:[new yy.Column({columnid:'*'})],
					from: [new yy.ParamValue({param:0})]
				});
				select.preparams = [sql];	
				return select;
		} else {
			// Standard interface
			// alasql('#sql');
			if(typeof sql === 'string' && sql[0]==='#' && typeof document === "object") {
				sql = document.querySelector(sql).textContent;
			} else if(typeof sql === 'object' && sql instanceof HTMElement) {
				sql = sql.textContent;
			} else if(typeof sql === 'function') {
				// to run multiline functions
				sql = sql.toString().slice(14,-3);
			}
			// Run SQL			
			return alasql.exec(sql, params, cb, scope);
		}
	}
};

/** 
	Current version of alasql 
 	@constant {string} 
*/
alasql.version = "0.2.1";

/**
	Debug flag
	@type {boolean}
*/
alasql.debug = undefined; // Initial debug variable




/** 
	Get path of alasql.js
	@function 
	@todo Rewrite and simplify the code. Review, is this function is required separately
*/
function getAlaSQLPath() {
	/** type {string} Path to alasql library and plugins */
	alasql.path = '';

	if (typeof importScripts === 'function') {
		alasql.path = '';		
		/** @todo Check how to get path in worker */
	} else if(typeof exports !== 'undefined') { 
		alasql.path = __dirname;
	
	} else if(typeof Meteor === 'object' && Meteor.isClient) {
		alasql.path = '/packages/dist/';
	
	} else if(typeof Meteor === 'object' && Meteor.isServer) {
		alasql.path = 'assets/packages/dist/';
	
	} else if(typeof document !== 'undefined') {
		var sc = document.getElementsByTagName('script');
		
		for(var i=0;i<sc.length;i++) {	
			if (sc[i].src.substr(-16).toLowerCase() === 'alasql-worker.js') {
				alasql.path = sc[i].src.substr(0,sc[i].src.length-16); 
				break;

			} else if (sc[i].src.substr(-20).toLowerCase() === 'alasql-worker.min.js') {
				alasql.path = sc[i].src.substr(0,sc[i].src.length-20);
				break;
			
			} else if (sc[i].src.substr(-9).toLowerCase() === 'alasql.js') {
				alasql.path = sc[i].src.substr(0,sc[i].src.length-9); 
				break;
			
			} else if (sc[i].src.substr(-13).toLowerCase() === 'alasql.min.js') {
				alasql.path = sc[i].src.substr(0,sc[i].src.length-13); 
				break;
			}
		}	
	}
}

getAlaSQLPath();



/* parser generated by jison 0.4.15 */
/*
  Returns a Parser object of the following structure:

  Parser: {
    yy: {}
  }

  Parser.prototype: {
    yy: {},
    trace: function(),
    symbols_: {associative list: name ==> number},
    terminals_: {associative list: number ==> name},
    productions_: [...],
    performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$),
    table: [...],
    defaultActions: {...},
    parseError: function(str, hash),
    parse: function(input),

    lexer: {
        EOF: 1,
        parseError: function(str, hash),
        setInput: function(input),
        input: function(),
        unput: function(str),
        more: function(),
        less: function(n),
        pastInput: function(),
        upcomingInput: function(),
        showPosition: function(),
        test_match: function(regex_match_array, rule_index),
        next: function(),
        lex: function(),
        begin: function(condition),
        popState: function(),
        _currentRules: function(),
        topState: function(),
        pushState: function(condition),

        options: {
            ranges: boolean           (optional: true ==> token location info will include a .range[] member)
            flex: boolean             (optional: true ==> flex-like lexing behaviour where the rules are tested exhaustively to find the longest match)
            backtrack_lexer: boolean  (optional: true ==> lexer regexes are tested in order and for each matching regex the action code is invoked; the lexer terminates the scan when a token is returned by the action code)
        },

        performAction: function(yy, yy_, $avoiding_name_collisions, YY_START),
        rules: [...],
        conditions: {associative list: name ==> set},
    }
  }


  token location info (@$, _$, etc.): {
    first_line: n,
    last_line: n,
    first_column: n,
    last_column: n,
    range: [start_number, end_number]       (where the numbers are indexes into the input string, regular zero-based)
  }


  the parseError function receives a 'hash' object with these members for lexer and parser errors: {
    text:        (matched text)
    token:       (the produced terminal token, if any)
    line:        (yylineno)
  }
  while parser (grammar) errors will also provide these members, i.e. parser errors deliver a superset of attributes: {
    loc:         (yylloc)
    expected:    (string describing the set of expected tokens)
    recoverable: (boolean: TRUE when the parser has a error recovery rule available for this particular error)
  }
*/
var parser = (function(){
var o=function(k,v,o,l){for(o=o||{},l=k.length;l--;o[k[l]]=v);return o},$V0=[2,10],$V1=[1,97],$V2=[1,98],$V3=[1,6],$V4=[1,39],$V5=[1,73],$V6=[1,70],$V7=[1,89],$V8=[1,88],$V9=[1,65],$Va=[1,96],$Vb=[1,80],$Vc=[1,78],$Vd=[1,62],$Ve=[1,66],$Vf=[1,60],$Vg=[1,64],$Vh=[1,57],$Vi=[1,68],$Vj=[1,58],$Vk=[1,63],$Vl=[1,77],$Vm=[1,71],$Vn=[1,79],$Vo=[1,81],$Vp=[1,82],$Vq=[1,75],$Vr=[1,76],$Vs=[1,74],$Vt=[1,83],$Vu=[1,84],$Vv=[1,85],$Vw=[1,86],$Vx=[1,87],$Vy=[1,93],$Vz=[1,61],$VA=[1,72],$VB=[1,67],$VC=[1,91],$VD=[1,92],$VE=[1,59],$VF=[1,101],$VG=[1,102],$VH=[8,283,473,474],$VI=[8,283,287,473,474],$VJ=[1,109],$VK=[120,325,379],$VL=[1,117],$VM=[1,116],$VN=[1,121],$VO=[1,148],$VP=[1,158],$VQ=[1,161],$VR=[1,156],$VS=[1,164],$VT=[1,168],$VU=[1,165],$VV=[1,153],$VW=[1,155],$VX=[1,157],$VY=[1,166],$VZ=[1,150],$V_=[1,175],$V$=[1,171],$V01=[1,172],$V11=[1,176],$V21=[1,177],$V31=[1,178],$V41=[1,179],$V51=[1,180],$V61=[1,181],$V71=[1,182],$V81=[1,183],$V91=[1,184],$Va1=[1,159],$Vb1=[1,160],$Vc1=[1,162],$Vd1=[1,163],$Ve1=[1,169],$Vf1=[1,167],$Vg1=[1,170],$Vh1=[1,154],$Vi1=[1,174],$Vj1=[1,185],$Vk1=[4,5],$Vl1=[2,430],$Vm1=[1,188],$Vn1=[1,192],$Vo1=[1,200],$Vp1=[8,66,72,87,92,109,119,151,157,158,172,187,219,232,234,283,287,473,474],$Vq1=[4,5,8,66,70,71,72,106,109,113,114,115,119,120,121,122,123,124,125,126,127,128,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,172,174,176,187,263,264,265,266,267,268,269,270,271,283,287,390,394,473,474],$Vr1=[4,5,8,48,66,68,70,71,72,83,87,89,92,93,101,106,109,113,114,115,119,120,121,122,123,124,125,126,127,128,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,168,169,170,172,174,176,178,187,195,197,209,210,211,212,213,214,215,216,219,226,229,230,232,234,252,263,264,265,266,267,268,269,270,271,275,283,285,286,287,288,289,290,291,292,293,294,295,296,297,298,302,303,304,305,307,310,311,319,365,369,370,373,375,377,378,386,387,388,390,394,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474],$Vs1=[1,229],$Vt1=[1,236],$Vu1=[1,245],$Vv1=[1,250],$Vw1=[1,249],$Vx1=[4,5,8,66,71,72,87,92,101,109,119,121,122,127,131,134,141,143,145,151,157,158,168,169,170,172,187,219,232,234,251,252,253,254,256,263,264,265,266,267,268,269,270,271,273,274,275,276,277,279,280,283,287,291,390,394,473,474],$Vy1=[2,150],$Vz1=[1,261],$VA1=[8,68,72,283,287,469,473,474],$VB1=[4,5,8,66,71,72,87,92,101,109,119,121,122,127,131,134,141,143,145,151,153,157,158,168,169,170,172,174,176,184,187,219,232,234,251,252,253,254,256,263,264,265,266,267,268,269,270,271,273,274,275,276,277,279,280,283,287,291,390,394,473,474],$VC1=[4,5,8,48,66,68,70,71,72,83,87,89,92,93,101,106,109,113,114,115,119,120,121,122,123,124,125,126,127,128,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,168,169,170,172,174,176,178,182,187,195,197,209,210,211,212,213,214,215,216,217,218,219,226,229,230,232,234,252,263,264,265,266,267,268,269,270,271,275,276,283,285,286,287,288,289,290,291,292,293,294,295,296,297,298,302,303,304,305,307,310,311,315,319,328,340,341,342,345,346,357,359,365,369,370,371,372,373,374,375,377,378,386,387,388,390,394,396,398,404,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474],$VD1=[4,5,8,48,66,83,115,135,145,178,252,283,307,310,311,319,365,369,370,373,375,377,378,386,387,388,405,407,408,410,411,412,413,414,418,419,422,423,469,471,472,473,474],$VE1=[1,274],$VF1=[2,461],$VG1=[1,277],$VH1=[2,820],$VI1=[8,72,83,122,127,135,178,275,283,287,441,473,474],$VJ1=[8,68,283,287,473,474],$VK1=[2,523],$VL1=[1,303],$VM1=[4,5,145],$VN1=[1,333],$VO1=[1,310],$VP1=[1,318],$VQ1=[1,317],$VR1=[1,324],$VS1=[1,315],$VT1=[1,319],$VU1=[1,316],$VV1=[1,320],$VW1=[1,322],$VX1=[1,334],$VY1=[1,331],$VZ1=[1,332],$V_1=[1,312],$V$1=[1,314],$V02=[1,309],$V12=[1,311],$V22=[1,313],$V32=[1,321],$V42=[1,323],$V52=[1,325],$V62=[1,326],$V72=[1,327],$V82=[1,328],$V92=[1,329],$Va2=[1,335],$Vb2=[1,336],$Vc2=[1,337],$Vd2=[1,338],$Ve2=[2,273],$Vf2=[4,5,8,48,66,68,70,71,72,83,87,89,92,93,101,106,109,113,114,115,119,120,121,122,123,124,125,126,127,128,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,168,169,170,172,174,176,178,187,195,197,209,210,211,212,213,214,215,216,217,218,219,226,229,230,232,234,252,263,264,265,266,267,268,269,270,271,275,276,283,285,286,287,288,289,290,291,292,293,294,295,296,297,298,302,303,304,305,307,310,311,315,319,328,340,341,345,346,365,369,370,373,375,377,378,386,387,388,390,394,396,398,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474],$Vg2=[2,335],$Vh2=[1,357],$Vi2=[1,367],$Vj2=[4,5,8,48,66,68,70,71,72,83,87,89,92,93,101,106,109,113,114,115,119,120,121,122,123,124,125,126,127,128,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,168,169,170,172,174,176,178,187,195,197,209,210,211,212,213,214,215,216,217,218,219,226,229,230,232,234,252,263,264,265,266,267,268,269,270,271,275,283,285,286,287,288,289,290,291,292,293,294,295,296,297,298,302,303,304,305,307,310,311,319,365,369,370,373,375,377,378,386,387,388,390,394,396,398,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474],$Vk2=[1,383],$Vl2=[1,391],$Vm2=[1,390],$Vn2=[4,5,8,66,68,72,87,92,109,119,151,157,158,195,197,209,210,211,212,213,214,215,216,217,218,219,232,234,283,287,473,474],$Vo2=[8,66,68,72,87,92,109,119,151,157,158,195,197,209,210,211,212,213,214,215,216,217,218,219,232,234,283,287,473,474],$Vp2=[2,188],$Vq2=[1,411],$Vr2=[8,66,72,87,92,109,119,151,157,158,172,219,232,234,283,287,473,474],$Vs2=[2,151],$Vt2=[1,414],$Vu2=[4,5,106],$Vv2=[1,426],$Vw2=[1,443],$Vx2=[1,425],$Vy2=[1,424],$Vz2=[1,420],$VA2=[1,421],$VB2=[1,422],$VC2=[1,423],$VD2=[1,427],$VE2=[1,428],$VF2=[1,429],$VG2=[1,430],$VH2=[1,431],$VI2=[1,432],$VJ2=[1,433],$VK2=[1,434],$VL2=[1,435],$VM2=[1,436],$VN2=[1,437],$VO2=[1,438],$VP2=[1,439],$VQ2=[1,440],$VR2=[1,442],$VS2=[1,444],$VT2=[1,445],$VU2=[1,446],$VV2=[1,447],$VW2=[1,448],$VX2=[1,449],$VY2=[1,450],$VZ2=[1,453],$V_2=[1,454],$V$2=[1,455],$V03=[1,456],$V13=[1,457],$V23=[1,458],$V33=[1,459],$V43=[1,460],$V53=[1,461],$V63=[1,462],$V73=[1,463],$V83=[1,464],$V93=[68,83,178],$Va3=[8,68,72,143,176,276,283,287,315,328,340,341,345,346,473,474],$Vb3=[1,481],$Vc3=[8,68,72,283,287,473,474],$Vd3=[1,482],$Ve3=[1,490],$Vf3=[4,5,71,121,122,127,131,134,141,143,145,168,169,170,251,252,253,254,256,263,264,265,266,267,268,269,270,271,273,274,275,276,277,279,280,291,390,394],$Vg3=[8,66,72,87,92,101,109,119,151,157,158,172,187,219,232,234,283,287,473,474],$Vh3=[4,5,122,275],$Vi3=[1,518],$Vj3=[8,68,70,72,283,287,473,474],$Vk3=[8,68,70,72,122,127,129,134,141,283,287,390,394,473,474],$Vl3=[2,821],$Vm3=[8,68,70,72,122,129,134,141,283,287,390,394,473,474],$Vn3=[8,72,83,122,135,178,275,283,287,441,473,474],$Vo3=[1,537],$Vp3=[1,538],$Vq3=[153,155,306],$Vr3=[2,410],$Vs3=[1,586],$Vt3=[1,600],$Vu3=[4,5,8,48,66,68,70,71,72,83,87,89,92,93,101,106,109,115,119,120,121,122,124,125,127,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,168,170,172,174,176,178,187,195,197,209,210,211,212,213,214,215,216,219,226,229,230,232,234,252,263,264,265,266,267,268,269,270,271,275,283,285,286,287,288,289,290,291,292,293,294,295,296,297,298,302,303,304,305,307,310,311,319,365,369,370,373,375,377,378,386,387,388,390,394,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474],$Vv3=[2,350],$Vw3=[1,607],$Vx3=[283,285,287],$Vy3=[68,398],$Vz3=[68,396,398],$VA3=[1,614],$VB3=[4,5,8,48,66,68,70,72,83,87,89,92,93,101,106,109,113,114,115,119,120,121,122,123,124,125,126,127,128,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,168,169,170,172,174,176,178,187,195,197,209,210,211,212,213,214,215,216,219,226,229,230,232,234,252,263,264,265,266,267,268,269,270,271,275,283,285,286,287,288,289,290,291,292,293,294,295,296,297,298,302,303,304,305,307,310,311,319,365,369,370,373,375,377,378,386,387,388,390,394,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474],$VC3=[68,396],$VD3=[8,66,72,87,92,109,119,151,157,158,219,232,234,283,287,473,474],$VE3=[1,649],$VF3=[8,66,72,283,287,473,474],$VG3=[1,655],$VH3=[1,656],$VI3=[1,657],$VJ3=[4,5,8,66,68,70,71,72,106,109,113,114,115,119,120,121,122,123,124,125,126,127,128,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,168,169,170,172,174,176,187,263,264,265,266,267,268,269,270,271,283,287,390,394,473,474],$VK3=[1,707],$VL3=[1,706],$VM3=[1,720],$VN3=[8,66,68,72,87,92,101,109,119,151,157,158,172,187,219,232,234,283,287,473,474],$VO3=[1,746],$VP3=[8,68,70,72,129,134,141,283,287,390,394,473,474],$VQ3=[8,68,72,129,283,287,473,474],$VR3=[8,72,83,135,178,283,287,441,473,474],$VS3=[1,768],$VT3=[4,5,8,48,66,68,70,71,72,83,87,89,92,93,101,106,109,115,119,120,121,122,124,125,127,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,170,172,174,176,178,187,195,197,209,210,211,212,213,214,215,216,219,226,229,230,232,234,252,263,264,265,266,267,268,269,270,271,275,283,285,286,287,288,289,290,292,293,294,295,296,297,298,302,303,304,305,307,310,311,319,365,369,370,373,375,377,378,386,387,388,390,394,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474],$VU3=[4,5,8,48,66,68,70,71,72,83,87,89,92,93,101,106,109,115,119,120,121,122,124,125,127,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,170,172,174,176,178,187,195,197,209,210,211,212,213,214,215,216,219,226,229,230,232,234,252,263,264,265,266,267,268,269,270,271,275,283,285,286,287,288,290,292,293,294,295,296,297,298,302,303,304,305,307,310,311,319,365,369,370,373,375,377,378,386,387,388,390,394,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474],$VV3=[4,5,8,48,66,68,70,71,72,83,87,89,92,93,101,106,109,115,119,120,121,122,123,124,125,127,128,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,168,169,170,172,174,176,178,187,195,197,209,210,211,212,213,214,215,216,219,226,229,230,232,234,252,263,264,265,266,267,268,269,270,271,275,283,285,286,287,288,289,290,291,292,293,294,295,296,297,298,302,303,304,305,307,310,311,319,365,369,370,373,375,377,378,386,387,388,390,394,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474],$VW3=[4,5,8,48,66,68,70,71,72,83,87,89,92,93,101,109,115,119,120,121,122,124,125,127,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,170,172,174,176,178,187,195,197,209,210,211,212,213,214,215,216,219,226,229,230,232,234,252,263,264,265,266,267,268,269,270,271,275,283,285,286,287,289,292,293,294,295,296,297,298,302,303,305,307,310,311,319,365,369,370,373,375,377,378,386,387,388,390,394,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474],$VX3=[2,374],$VY3=[4,5,8,48,66,68,70,71,72,83,87,89,92,101,109,119,120,121,122,124,125,127,131,132,134,135,137,138,139,141,145,151,153,155,157,158,159,160,161,162,164,170,172,174,176,178,187,195,197,209,210,211,212,213,214,215,216,219,226,229,230,232,234,252,263,264,265,266,267,268,269,270,271,275,283,285,286,287,289,302,303,305,307,310,311,319,365,369,370,373,375,377,378,386,387,388,390,394,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474],$VZ3=[2,271],$V_3=[4,5,8,48,66,68,70,71,72,83,87,89,92,93,101,106,109,113,114,115,119,120,121,122,123,124,125,126,127,128,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,168,169,170,172,174,176,178,187,195,197,209,210,211,212,213,214,215,216,219,226,229,230,232,234,252,263,264,265,266,267,268,269,270,271,275,283,285,286,287,288,289,290,291,292,293,294,295,296,297,298,302,303,304,305,307,310,311,319,365,369,370,373,375,377,378,386,387,388,390,394,396,398,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474],$V$3=[1,804],$V04=[8,72,283,287,473,474],$V14=[1,814],$V24=[8,66,72,109,119,151,157,158,219,232,234,283,287,473,474],$V34=[8,66,68,72,87,92,109,119,151,157,158,172,187,219,232,234,283,287,473,474],$V44=[4,5,66,70,71,72,106,109,113,114,115,119,120,121,122,123,124,125,126,127,128,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,174,176,263,264,265,266,267,268,269,270,271,390,394],$V54=[4,5,66,68,70,71,72,106,109,113,114,115,119,120,121,122,123,124,125,126,127,128,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,174,176,263,264,265,266,267,268,269,270,271,390,394],$V64=[2,752],$V74=[4,5,66,68,70,71,106,109,113,114,115,119,120,121,122,123,124,125,126,127,128,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,174,176,263,264,265,266,267,268,269,270,271,390,394],$V84=[1,865],$V94=[8,68,72,119,283,285,287,435,473,474],$Va4=[1,874],$Vb4=[1,873],$Vc4=[2,540],$Vd4=[1,891],$Ve4=[70,129],$Vf4=[8,68,70,72,129,134,283,287,390,394,473,474],$Vg4=[2,679],$Vh4=[1,907],$Vi4=[1,908],$Vj4=[1,913],$Vk4=[1,914],$Vl4=[2,312],$Vm4=[1,932],$Vn4=[1,942],$Vo4=[8,68,72,283,285,287,435,473,474],$Vp4=[1,945],$Vq4=[8,66,68,72,87,92,109,119,151,157,158,195,197,209,210,211,212,213,214,215,216,219,232,234,283,287,473,474],$Vr4=[8,283,285,287,435,473,474],$Vs4=[8,66,72,109,151,157,158,219,232,234,283,287,473,474],$Vt4=[1,960],$Vu4=[1,964],$Vv4=[1,965],$Vw4=[1,967],$Vx4=[1,968],$Vy4=[1,969],$Vz4=[1,970],$VA4=[1,971],$VB4=[1,972],$VC4=[1,973],$VD4=[1,974],$VE4=[1,998],$VF4=[68,72],$VG4=[113,115],$VH4=[1,1051],$VI4=[8,66,72,109,151,157,158,232,234,283,287,473,474],$VJ4=[8,66,72,87,92,109,119,151,157,158,195,197,209,210,211,212,213,214,215,216,219,232,234,283,287,473,474],$VK4=[1,1092],$VL4=[1,1094],$VM4=[4,5,71,131,134,141,145,170,279,390,394],$VN4=[1,1108],$VO4=[8,66,68,72,151,157,158,232,234,283,287,473,474],$VP4=[1,1127],$VQ4=[1,1129],$VR4=[1,1126],$VS4=[1,1125],$VT4=[1,1124],$VU4=[1,1130],$VV4=[1,1121],$VW4=[1,1122],$VX4=[1,1123],$VY4=[1,1142],$VZ4=[4,5,8,48,66,68,70,71,72,83,87,89,92,93,101,106,109,113,114,115,119,120,121,122,123,124,125,126,127,128,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,168,169,170,172,174,176,178,187,195,197,209,210,211,212,213,214,215,216,219,226,229,230,232,234,252,263,264,265,266,267,268,269,270,271,275,276,283,285,286,287,288,289,290,291,292,293,294,295,296,297,298,302,303,304,305,307,310,311,315,319,328,340,341,345,346,365,369,370,373,375,377,378,386,387,388,390,394,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474],$V_4=[1,1151],$V$4=[1,1159],$V05=[1,1158],$V15=[8,66,72,151,157,158,232,234,283,287,473,474],$V25=[8,66,72,87,92,109,119,151,157,158,195,197,209,210,211,212,213,214,215,216,217,218,219,232,234,283,287,473,474],$V35=[4,5,8,66,72,87,92,109,119,151,157,158,195,197,209,210,211,212,213,214,215,216,217,218,219,232,234,283,287,473,474],$V45=[1,1212],$V55=[1,1211],$V65=[1,1213],$V75=[176,182,340,341,342,345],$V85=[2,473],$V95=[1,1218],$Va5=[1,1237],$Vb5=[8,66,72,151,157,158,283,287,473,474],$Vc5=[1,1247],$Vd5=[1,1248],$Ve5=[1,1249],$Vf5=[1,1268],$Vg5=[4,8,283,287,315,328,473,474],$Vh5=[1,1314],$Vi5=[8,66,68,72,109,151,157,158,226,232,234,283,287,473,474],$Vj5=[1,1404],$Vk5=[1,1416],$Vl5=[1,1435],$Vm5=[8,66,72,151,157,158,283,287,384,473,474],$Vn5=[8,68,72,217,283,287,473,474];
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"Literal":3,"LITERAL":4,"BRALITERAL":5,"main":6,"Statements":7,"EOF":8,"Statements_group0":9,"AStatement":10,"ExplainStatement":11,"EXPLAIN":12,"QUERY":13,"PLAN":14,"Statement":15,"AlterTable":16,"AttachDatabase":17,"Call":18,"CreateDatabase":19,"CreateIndex":20,"CreateGraph":21,"CreateTable":22,"CreateView":23,"CreateEdge":24,"CreateVertex":25,"Declare":26,"Delete":27,"DetachDatabase":28,"DropDatabase":29,"DropIndex":30,"DropTable":31,"DropView":32,"If":33,"Insert":34,"Merge":35,"RenameTable":36,"Select":37,"ShowCreateTable":38,"ShowColumns":39,"ShowDatabases":40,"ShowIndex":41,"ShowTables":42,"TruncateTable":43,"WithSelect":44,"BeginTransaction":45,"CommitTransaction":46,"RollbackTransaction":47,"EndTransaction":48,"UseDatabase":49,"Update":50,"Help":51,"JavaScript":52,"Source":53,"Assert":54,"While":55,"Continue":56,"Break":57,"BeginEnd":58,"Print":59,"Require":60,"SetVariable":61,"ExpressionStatement":62,"AddRule":63,"Query":64,"Echo":65,"WITH":66,"WithTablesList":67,"COMMA":68,"WithTable":69,"AS":70,"LPAR":71,"RPAR":72,"SelectClause":73,"Select_option0":74,"IntoClause":75,"FromClause":76,"Select_option1":77,"WhereClause":78,"GroupClause":79,"OrderClause":80,"LimitClause":81,"UnionClause":82,"SEARCH":83,"Select_repetition0":84,"Select_option2":85,"PivotClause":86,"PIVOT":87,"Expression":88,"FOR":89,"PivotClause_option0":90,"PivotClause_option1":91,"UNPIVOT":92,"IN":93,"ColumnsList":94,"PivotClause_option2":95,"PivotClause2":96,"AsList":97,"AsLiteral":98,"AsPart":99,"RemoveClause":100,"REMOVE":101,"RemoveClause_option0":102,"RemoveColumnsList":103,"RemoveColumn":104,"Column":105,"LIKE":106,"StringValue":107,"SearchSelector":108,"ORDER":109,"BY":110,"OrderExpressionsList":111,"SearchSelector_option0":112,"ARROW":113,"CARET":114,"EQ":115,"SearchSelector_repetition_plus0":116,"SearchSelector_repetition_plus1":117,"SearchSelector_option1":118,"WHERE":119,"CLASS":120,"NUMBER":121,"STRING":122,"SLASH":123,"VERTEX":124,"EDGE":125,"EXCLAMATION":126,"SHARP":127,"MODULO":128,"GT":129,"LT":130,"DOLLAR":131,"DOT":132,"Json":133,"AT":134,"SET":135,"SetColumnsList":136,"TO":137,"VALUE":138,"ROW":139,"ExprList":140,"COLON":141,"PlusStar":142,"NOT":143,"SearchSelector_repetition2":144,"IF":145,"SearchSelector_repetition3":146,"Aggregator":147,"SearchSelector_repetition4":148,"SearchSelector_group0":149,"SearchSelector_repetition5":150,"UNION":151,"SearchSelectorList":152,"ALL":153,"SearchSelector_repetition6":154,"ANY":155,"SearchSelector_repetition7":156,"INTERSECT":157,"EXCEPT":158,"AND":159,"OR":160,"PATH":161,"RETURN":162,"ResultColumns":163,"REPEAT":164,"SearchSelector_repetition8":165,"SearchSelectorList_repetition0":166,"SearchSelectorList_repetition1":167,"PLUS":168,"STAR":169,"QUESTION":170,"SearchFrom":171,"FROM":172,"SelectModifier":173,"DISTINCT":174,"TopClause":175,"UNIQUE":176,"SelectClause_option0":177,"SELECT":178,"COLUMN":179,"MATRIX":180,"TEXTSTRING":181,"INDEX":182,"RECORDSET":183,"TOP":184,"NumValue":185,"TopClause_option0":186,"INTO":187,"Table":188,"FuncValue":189,"ParamValue":190,"VarValue":191,"FromTablesList":192,"JoinTablesList":193,"ApplyClause":194,"CROSS":195,"APPLY":196,"OUTER":197,"FromTable":198,"FromTable_option0":199,"FromTable_option1":200,"FromString":201,"JoinTable":202,"JoinMode":203,"JoinTableAs":204,"OnClause":205,"JoinTableAs_option0":206,"JoinTableAs_option1":207,"JoinModeMode":208,"NATURAL":209,"JOIN":210,"INNER":211,"LEFT":212,"RIGHT":213,"FULL":214,"SEMI":215,"ANTI":216,"ON":217,"USING":218,"GROUP":219,"GroupExpressionsList":220,"HavingClause":221,"GroupExpression":222,"GROUPING":223,"ROLLUP":224,"CUBE":225,"HAVING":226,"CORRESPONDING":227,"OrderExpression":228,"DIRECTION":229,"COLLATE":230,"NOCASE":231,"LIMIT":232,"OffsetClause":233,"OFFSET":234,"LimitClause_option0":235,"FETCH":236,"LimitClause_option1":237,"LimitClause_option2":238,"LimitClause_option3":239,"ResultColumn":240,"Star":241,"AggrValue":242,"Op":243,"LogicValue":244,"NullValue":245,"ExistsValue":246,"CaseValue":247,"CastClause":248,"NewClause":249,"Expression_group0":250,"CURRENT_TIMESTAMP":251,"JAVASCRIPT":252,"NEW":253,"CAST":254,"ColumnType":255,"CONVERT":256,"PrimitiveValue":257,"OverClause":258,"OVER":259,"OverPartitionClause":260,"OverOrderByClause":261,"PARTITION":262,"SUM":263,"COUNT":264,"MIN":265,"MAX":266,"AVG":267,"FIRST":268,"LAST":269,"AGGR":270,"ARRAY":271,"FuncValue_option0":272,"TRUE":273,"FALSE":274,"NSTRING":275,"NULL":276,"EXISTS":277,"ParamValue_group0":278,"BRAQUESTION":279,"CASE":280,"WhensList":281,"ElseClause":282,"END":283,"When":284,"WHEN":285,"THEN":286,"ELSE":287,"REGEXP":288,"ESCAPE":289,"NOT_LIKE":290,"MINUS":291,"GE":292,"LE":293,"EQEQ":294,"EQEQEQ":295,"NE":296,"NEEQEQ":297,"NEEQEQEQ":298,"CondOp":299,"AllSome":300,"ColFunc":301,"BETWEEN":302,"NOT_BETWEEN":303,"IS":304,"DOUBLECOLON":305,"SOME":306,"UPDATE":307,"SetColumn":308,"SetColumn_group0":309,"DELETE":310,"INSERT":311,"Into":312,"ValuesListsList":313,"REPLACE":314,"DEFAULT":315,"ValuesList":316,"Value":317,"DateValue":318,"CREATE":319,"TemporaryClause":320,"TableClass":321,"IfNotExists":322,"CreateTableDefClause":323,"CreateTableOptionsClause":324,"TABLE":325,"CreateTableOptions":326,"CreateTableOption":327,"IDENTITY":328,"TEMP":329,"ColumnDefsList":330,"ConstraintsList":331,"Constraint":332,"ConstraintName":333,"PrimaryKey":334,"ForeignKey":335,"UniqueKey":336,"IndexKey":337,"Check":338,"CONSTRAINT":339,"CHECK":340,"PRIMARY":341,"KEY":342,"PrimaryKey_option0":343,"ColsList":344,"FOREIGN":345,"REFERENCES":346,"ForeignKey_option0":347,"OnForeignKeyClause":348,"ParColsList":349,"OnDeleteClause":350,"OnUpdateClause":351,"NO":352,"ACTION":353,"UniqueKey_option0":354,"ColumnDef":355,"ColumnConstraintsClause":356,"ColumnConstraints":357,"NumberMax":358,"ENUM":359,"ColumnConstraintsList":360,"ColumnConstraint":361,"ParLiteral":362,"ColumnConstraint_option0":363,"ColumnConstraint_option1":364,"DROP":365,"DropTable_group0":366,"IfExists":367,"TablesList":368,"ALTER":369,"RENAME":370,"ADD":371,"MODIFY":372,"ATTACH":373,"DATABASE":374,"DETACH":375,"AsClause":376,"USE":377,"SHOW":378,"VIEW":379,"CreateView_option0":380,"CreateView_option1":381,"SubqueryRestriction":382,"READ":383,"ONLY":384,"OPTION":385,"HELP":386,"SOURCE":387,"ASSERT":388,"JsonObject":389,"ATLBRA":390,"JsonArray":391,"JsonValue":392,"JsonPrimitiveValue":393,"LCUR":394,"JsonPropertiesList":395,"RCUR":396,"JsonElementsList":397,"RBRA":398,"JsonProperty":399,"OnOff":400,"AtDollar":401,"SetPropsList":402,"SetProp":403,"OFF":404,"COMMIT":405,"TRANSACTION":406,"ROLLBACK":407,"BEGIN":408,"ElseStatement":409,"WHILE":410,"CONTINUE":411,"BREAK":412,"PRINT":413,"REQUIRE":414,"StringValuesList":415,"PluginsList":416,"Plugin":417,"ECHO":418,"DECLARE":419,"DeclaresList":420,"DeclareItem":421,"TRUNCATE":422,"MERGE":423,"MergeInto":424,"MergeUsing":425,"MergeOn":426,"MergeMatchedList":427,"OutputClause":428,"MergeMatched":429,"MergeNotMatched":430,"MATCHED":431,"MergeMatchedAction":432,"MergeNotMatchedAction":433,"TARGET":434,"OUTPUT":435,"CreateVertex_option0":436,"CreateVertex_option1":437,"CreateVertex_option2":438,"CreateVertexSet":439,"SharpValue":440,"CONTENT":441,"CreateEdge_option0":442,"GRAPH":443,"GraphList":444,"GraphVertexEdge":445,"GraphElement":446,"GraphVertexEdge_option0":447,"GraphVertexEdge_option1":448,"GraphVertexEdge_group0":449,"GraphVertexEdge_option2":450,"GraphVertexEdge_option3":451,"GraphVertexEdge_group1":452,"GraphVar":453,"GraphAsClause":454,"GraphAtClause":455,"GraphElement_option0":456,"GraphElement_option1":457,"GraphElement_option2":458,"GraphElement_option3":459,"ColonLiteral":460,"SharpLiteral":461,"DeleteVertex":462,"DeleteVertex_option0":463,"DeleteEdge":464,"DeleteEdge_option0":465,"DeleteEdge_option1":466,"DeleteEdge_option2":467,"Term":468,"COLONDASH":469,"TermsList":470,"QUESTIONDASH":471,"CALL":472,"SEMICOLON":473,"GO":474,"PERCENT":475,"ROWS":476,"NEXT":477,"FuncValue_option0_group0":478,"$accept":0,"$end":1},
terminals_: {2:"error",4:"LITERAL",5:"BRALITERAL",8:"EOF",12:"EXPLAIN",13:"QUERY",14:"PLAN",48:"EndTransaction",66:"WITH",68:"COMMA",70:"AS",71:"LPAR",72:"RPAR",83:"SEARCH",87:"PIVOT",89:"FOR",92:"UNPIVOT",93:"IN",101:"REMOVE",106:"LIKE",109:"ORDER",110:"BY",113:"ARROW",114:"CARET",115:"EQ",119:"WHERE",120:"CLASS",121:"NUMBER",122:"STRING",123:"SLASH",124:"VERTEX",125:"EDGE",126:"EXCLAMATION",127:"SHARP",128:"MODULO",129:"GT",130:"LT",131:"DOLLAR",132:"DOT",134:"AT",135:"SET",137:"TO",138:"VALUE",139:"ROW",141:"COLON",143:"NOT",145:"IF",151:"UNION",153:"ALL",155:"ANY",157:"INTERSECT",158:"EXCEPT",159:"AND",160:"OR",161:"PATH",162:"RETURN",164:"REPEAT",168:"PLUS",169:"STAR",170:"QUESTION",172:"FROM",174:"DISTINCT",176:"UNIQUE",178:"SELECT",179:"COLUMN",180:"MATRIX",181:"TEXTSTRING",182:"INDEX",183:"RECORDSET",184:"TOP",187:"INTO",195:"CROSS",196:"APPLY",197:"OUTER",209:"NATURAL",210:"JOIN",211:"INNER",212:"LEFT",213:"RIGHT",214:"FULL",215:"SEMI",216:"ANTI",217:"ON",218:"USING",219:"GROUP",223:"GROUPING",224:"ROLLUP",225:"CUBE",226:"HAVING",227:"CORRESPONDING",229:"DIRECTION",230:"COLLATE",231:"NOCASE",232:"LIMIT",234:"OFFSET",236:"FETCH",251:"CURRENT_TIMESTAMP",252:"JAVASCRIPT",253:"NEW",254:"CAST",256:"CONVERT",259:"OVER",262:"PARTITION",263:"SUM",264:"COUNT",265:"MIN",266:"MAX",267:"AVG",268:"FIRST",269:"LAST",270:"AGGR",271:"ARRAY",273:"TRUE",274:"FALSE",275:"NSTRING",276:"NULL",277:"EXISTS",279:"BRAQUESTION",280:"CASE",283:"END",285:"WHEN",286:"THEN",287:"ELSE",288:"REGEXP",289:"ESCAPE",290:"NOT_LIKE",291:"MINUS",292:"GE",293:"LE",294:"EQEQ",295:"EQEQEQ",296:"NE",297:"NEEQEQ",298:"NEEQEQEQ",302:"BETWEEN",303:"NOT_BETWEEN",304:"IS",305:"DOUBLECOLON",306:"SOME",307:"UPDATE",310:"DELETE",311:"INSERT",314:"REPLACE",315:"DEFAULT",318:"DateValue",319:"CREATE",325:"TABLE",328:"IDENTITY",329:"TEMP",339:"CONSTRAINT",340:"CHECK",341:"PRIMARY",342:"KEY",345:"FOREIGN",346:"REFERENCES",352:"NO",353:"ACTION",357:"ColumnConstraints",359:"ENUM",365:"DROP",369:"ALTER",370:"RENAME",371:"ADD",372:"MODIFY",373:"ATTACH",374:"DATABASE",375:"DETACH",377:"USE",378:"SHOW",379:"VIEW",383:"READ",384:"ONLY",385:"OPTION",386:"HELP",387:"SOURCE",388:"ASSERT",390:"ATLBRA",394:"LCUR",396:"RCUR",398:"RBRA",404:"OFF",405:"COMMIT",406:"TRANSACTION",407:"ROLLBACK",408:"BEGIN",410:"WHILE",411:"CONTINUE",412:"BREAK",413:"PRINT",414:"REQUIRE",418:"ECHO",419:"DECLARE",422:"TRUNCATE",423:"MERGE",431:"MATCHED",434:"TARGET",435:"OUTPUT",441:"CONTENT",443:"GRAPH",469:"COLONDASH",471:"QUESTIONDASH",472:"CALL",473:"SEMICOLON",474:"GO",475:"PERCENT",476:"ROWS",477:"NEXT"},
productions_: [0,[3,1],[3,1],[6,2],[7,3],[7,1],[7,1],[11,2],[11,4],[10,1],[15,0],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[15,1],[44,3],[67,3],[67,1],[69,5],[37,10],[37,4],[86,8],[86,11],[96,4],[98,2],[98,1],[97,3],[97,1],[99,1],[99,3],[100,3],[103,3],[103,1],[104,1],[104,2],[108,1],[108,5],[108,5],[108,2],[108,1],[108,2],[108,2],[108,3],[108,4],[108,4],[108,4],[108,4],[108,1],[108,1],[108,1],[108,1],[108,1],[108,1],[108,2],[108,2],[108,2],[108,1],[108,1],[108,1],[108,2],[108,1],[108,2],[108,3],[108,4],[108,3],[108,1],[108,4],[108,2],[108,2],[108,4],[108,4],[108,4],[108,4],[108,4],[108,5],[108,4],[108,4],[108,4],[108,4],[108,4],[108,4],[108,4],[108,4],[108,6],[152,3],[152,1],[142,1],[142,1],[142,1],[171,2],[73,4],[73,4],[73,4],[73,3],[173,1],[173,2],[173,2],[173,2],[173,2],[173,2],[173,2],[173,2],[175,3],[175,4],[175,0],[75,0],[75,2],[75,2],[75,2],[75,2],[75,2],[76,2],[76,3],[76,5],[76,0],[194,6],[194,7],[194,6],[194,7],[192,1],[192,3],[198,4],[198,5],[198,3],[198,3],[198,2],[198,3],[198,1],[198,2],[198,3],[198,1],[198,1],[198,2],[198,3],[198,1],[198,2],[198,3],[198,1],[198,2],[198,3],[201,1],[188,3],[188,1],[193,2],[193,2],[193,1],[193,1],[202,3],[204,1],[204,2],[204,3],[204,3],[204,2],[204,3],[204,4],[204,5],[204,1],[204,2],[204,3],[204,1],[204,2],[204,3],[203,1],[203,2],[208,1],[208,2],[208,2],[208,3],[208,2],[208,3],[208,2],[208,3],[208,2],[208,2],[208,2],[205,2],[205,2],[205,0],[78,0],[78,2],[79,0],[79,4],[220,1],[220,3],[222,5],[222,4],[222,4],[222,1],[221,0],[221,2],[82,0],[82,2],[82,3],[82,2],[82,2],[82,3],[82,4],[82,3],[82,3],[80,0],[80,3],[111,1],[111,3],[228,1],[228,2],[228,3],[228,4],[81,0],[81,3],[81,8],[233,0],[233,2],[163,3],[163,1],[240,3],[240,2],[240,3],[240,2],[240,3],[240,2],[240,1],[241,5],[241,3],[241,1],[105,5],[105,3],[105,3],[105,1],[88,1],[88,1],[88,1],[88,1],[88,1],[88,1],[88,1],[88,1],[88,1],[88,1],[88,1],[88,1],[88,1],[88,1],[88,1],[88,1],[88,3],[88,3],[88,3],[88,1],[88,1],[52,1],[249,2],[249,2],[248,6],[248,8],[248,6],[248,8],[257,1],[257,1],[257,1],[257,1],[257,1],[257,1],[257,1],[242,5],[242,6],[242,6],[258,0],[258,4],[258,4],[258,5],[260,3],[261,3],[147,1],[147,1],[147,1],[147,1],[147,1],[147,1],[147,1],[147,1],[147,1],[189,5],[189,3],[189,4],[140,1],[140,3],[185,1],[244,1],[244,1],[107,1],[107,1],[245,1],[191,2],[246,4],[190,2],[190,2],[190,1],[190,1],[247,5],[247,4],[281,2],[281,1],[284,4],[282,2],[282,0],[243,3],[243,3],[243,5],[243,3],[243,5],[243,3],[243,3],[243,3],[243,3],[243,3],[243,3],[243,3],[243,3],[243,5],[243,3],[243,3],[243,3],[243,5],[243,3],[243,3],[243,3],[243,3],[243,3],[243,3],[243,3],[243,3],[243,3],[243,3],[243,3],[243,6],[243,6],[243,3],[243,3],[243,2],[243,2],[243,2],[243,2],[243,3],[243,5],[243,6],[243,5],[243,6],[243,4],[243,5],[243,3],[243,4],[243,3],[243,4],[243,3],[243,3],[243,3],[243,3],[301,1],[301,1],[301,4],[299,1],[299,1],[299,1],[299,1],[299,1],[299,1],[300,1],[300,1],[300,1],[50,6],[50,4],[136,1],[136,3],[308,3],[308,4],[27,5],[27,3],[34,5],[34,7],[34,5],[34,8],[34,4],[34,6],[34,7],[312,0],[312,1],[313,3],[313,1],[313,1],[313,5],[313,3],[313,3],[316,1],[316,3],[317,1],[317,1],[317,1],[317,1],[317,1],[317,1],[94,1],[94,3],[22,9],[22,5],[321,1],[321,1],[324,0],[324,1],[326,2],[326,1],[327,1],[327,3],[327,3],[320,0],[320,1],[322,0],[322,3],[323,3],[323,1],[323,2],[331,1],[331,3],[332,2],[332,2],[332,2],[332,2],[332,2],[333,0],[333,2],[338,4],[334,6],[335,9],[349,3],[348,0],[348,2],[350,4],[351,4],[336,5],[337,5],[337,5],[344,1],[344,1],[344,3],[344,3],[330,1],[330,3],[355,3],[355,2],[355,1],[255,6],[255,7],[255,4],[255,5],[255,1],[255,2],[255,4],[358,1],[358,1],[356,0],[356,1],[360,2],[360,1],[362,3],[361,2],[361,5],[361,3],[361,6],[361,1],[361,2],[361,4],[361,1],[361,2],[361,1],[361,1],[31,4],[368,3],[368,1],[367,0],[367,2],[16,6],[16,6],[16,6],[16,8],[16,6],[36,5],[17,4],[17,7],[17,6],[17,9],[28,3],[19,4],[19,6],[19,9],[19,6],[376,0],[376,2],[49,3],[49,2],[29,4],[29,5],[29,5],[20,8],[20,9],[30,3],[40,2],[40,4],[40,3],[40,5],[42,2],[42,4],[42,4],[42,6],[39,4],[39,6],[41,4],[41,6],[38,4],[38,6],[23,11],[23,8],[382,3],[382,3],[382,5],[32,4],[51,2],[51,1],[62,2],[53,2],[54,2],[54,2],[54,4],[133,4],[133,2],[133,2],[133,2],[133,2],[133,1],[133,2],[133,2],[392,1],[392,1],[393,1],[393,1],[393,1],[393,1],[393,1],[393,1],[393,1],[393,3],[389,3],[389,4],[389,2],[391,2],[391,3],[391,1],[395,3],[395,1],[399,3],[399,3],[399,3],[397,3],[397,1],[61,3],[61,5],[61,6],[401,1],[401,1],[402,3],[402,2],[403,1],[403,1],[403,3],[400,1],[400,1],[46,2],[47,2],[45,2],[33,4],[33,3],[409,2],[55,3],[56,1],[57,1],[58,3],[59,2],[59,2],[60,2],[60,2],[417,1],[417,1],[65,2],[415,3],[415,1],[416,3],[416,1],[26,2],[420,1],[420,3],[421,3],[421,4],[421,5],[421,6],[43,3],[35,6],[424,1],[424,2],[425,2],[426,2],[427,2],[427,2],[427,1],[427,1],[429,4],[429,6],[432,1],[432,3],[430,5],[430,7],[430,7],[430,9],[430,7],[430,9],[433,3],[433,6],[433,3],[433,6],[428,0],[428,2],[428,5],[428,4],[428,7],[25,6],[440,2],[439,0],[439,2],[439,2],[439,1],[24,8],[21,3],[21,4],[444,3],[444,1],[445,3],[445,7],[445,4],[453,2],[454,3],[455,2],[446,4],[460,2],[461,2],[461,2],[462,4],[464,6],[63,3],[63,2],[470,3],[470,1],[468,1],[468,4],[64,2],[18,2],[9,1],[9,1],[74,0],[74,1],[77,0],[77,1],[84,0],[84,2],[85,0],[85,1],[90,0],[90,1],[91,0],[91,1],[95,0],[95,1],[102,0],[102,1],[112,0],[112,1],[116,1],[116,2],[117,1],[117,2],[118,0],[118,1],[144,0],[144,2],[146,0],[146,2],[148,0],[148,2],[149,1],[149,1],[150,0],[150,2],[154,0],[154,2],[156,0],[156,2],[165,0],[165,2],[166,0],[166,2],[167,0],[167,2],[177,0],[177,1],[186,0],[186,1],[199,0],[199,1],[200,0],[200,1],[206,0],[206,1],[207,0],[207,1],[235,0],[235,1],[237,0],[237,1],[238,0],[238,1],[239,0],[239,1],[250,1],[250,1],[478,1],[478,1],[272,0],[272,1],[278,1],[278,1],[309,1],[309,1],[343,0],[343,1],[347,0],[347,1],[354,0],[354,1],[363,0],[363,1],[364,0],[364,1],[366,1],[366,1],[380,0],[380,1],[381,0],[381,1],[436,0],[436,1],[437,0],[437,1],[438,0],[438,1],[442,0],[442,1],[447,0],[447,1],[448,0],[448,1],[449,1],[449,1],[450,0],[450,1],[451,0],[451,1],[452,1],[452,1],[456,0],[456,1],[457,0],[457,1],[458,0],[458,1],[459,0],[459,1],[463,0],[463,2],[465,0],[465,2],[466,0],[466,2],[467,0],[467,2]],
performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate /* action[1] */, $$ /* vstack */, _$ /* lstack */) {
/* this == yyval */

var $0 = $$.length - 1;
switch (yystate) {
case 1:

			if (yy.casesensitive) this.$ = $$[$0];
			else this.$ = $$[$0].toLowerCase();
		
break;
case 2:
 this.$ = doubleq($$[$0].substr(1,$$[$0].length-2)); 
break;
case 3:
 return new yy.Statements({statements:$$[$0-1]}); 
break;
case 4:
 this.$ = $$[$0-2]; if($$[$0]) $$[$0-2].push($$[$0]); 
break;
case 5: case 6: case 63: case 73: case 78: case 131: case 165: case 191: case 192: case 228: case 247: case 259: case 330: case 347: case 417: case 433: case 434: case 438: case 446: case 486: case 487: case 522: case 607: case 614: case 638: case 640: case 642: case 656: case 657: case 687: case 703:
 this.$ = [$$[$0]]; 
break;
case 7:
 this.$ = $$[$0]; $$[$0].explain = true; 
break;
case 8:
 this.$ = $$[$0];  $$[$0].explain = true;
break;
case 9:
 
			this.$ = $$[$0];

			// TODO combine exists and queries
		    if(yy.exists) this.$.exists = yy.exists;
		    delete yy.exists;
		    if(yy.queries) this.$.queries = yy.queries;
			delete yy.queries;
		
break;
case 10: case 150: case 160: case 223: case 224: case 226: case 234: case 236: case 245: case 253: case 256: case 350: case 450: case 459: case 461: case 473: case 479: case 480: case 523:
 this.$ = undefined; 
break;
case 61:
 this.$ = new yy.WithSelect({withs: $$[$0-1], select:$$[$0]}); 
break;
case 62: case 521:
 $$[$0-2].push($$[$0]); this.$=$$[$0-2]; 
break;
case 64:
 this.$ = {name:$$[$0-4], select:$$[$0-1]}; 
break;
case 65:
   
			yy.extend(this.$,$$[$0-9]); yy.extend(this.$,$$[$0-8]); yy.extend(this.$,$$[$0-7]); yy.extend(this.$,$$[$0-6]); 
		    yy.extend(this.$,$$[$0-5]); yy.extend(this.$,$$[$0-4]);yy.extend(this.$,$$[$0-3]); 
		    yy.extend(this.$,$$[$0-2]); yy.extend(this.$,$$[$0-1]); yy.extend(this.$,$$[$0]); 
		    this.$ = $$[$0-9];
/*		    if(yy.exists) this.$.exists = yy.exists;
		    delete yy.exists;
		    if(yy.queries) this.$.queries = yy.queries;
			delete yy.queries;
*/		
break;
case 66:

			this.$ = new yy.Search({selectors:$$[$0-2], from:$$[$0]});
			yy.extend(this.$,$$[$0-1]);
		
break;
case 67:
 this.$ = {pivot:{expr:$$[$0-5], columnid:$$[$0-3], inlist:$$[$0-1], as:$$[$0]}}; 
break;
case 68:
 this.$ = {unpivot:{tocolumnid:$$[$0-8], forcolumnid:$$[$0-6], inlist:$$[$0-3], as:$$[$0]}}; 
break;
case 69: case 478: case 508: case 541: case 577: case 595: case 598: case 617:
 this.$ = $$[$0-1]; 
break;
case 70: case 71: case 79: case 135: case 173: case 233: case 266: case 274: case 275: case 276: case 277: case 278: case 279: case 280: case 281: case 282: case 283: case 284: case 285: case 286: case 287: case 289: case 302: case 303: case 304: case 305: case 306: case 307: case 349: case 406: case 407: case 408: case 409: case 410: case 411: case 474: case 505: case 507: case 581: case 582: case 583: case 584: case 585: case 586: case 590: case 592: case 593: case 602: case 615: case 616: case 678: case 692: case 693: case 695: case 696: case 707:
 this.$ = $$[$0]; 
break;
case 72: case 77: case 686: case 702:
 this.$ = $$[$0-2]; this.$.push($$[$0]); 
break;
case 74:
 this.$ = {expr:$$[$0]}; 
break;
case 75:
 this.$ = {expr:$$[$0-2],as:$$[$0]}; 
break;
case 76:
 this.$ = {removecolumns:$$[$0]}; 
break;
case 80:
 this.$ = {like:$$[$0]}; 
break;
case 81: case 93:
 this.$ = {srchid:"PROP", args: [$$[$0]]}; 
break;
case 82:
 this.$ = {srchid:"ORDERBY", args: $$[$0-1]}; 
break;
case 83:

			var dir = $$[$0-1];
			if(!dir) dir = 'ASC';
			this.$ = {srchid:"ORDERBY", args: [{expression: new yy.Column({columnid:'_'}), direction:dir}]};
		
break;
case 84:
 this.$ = {srchid:"APROP", args: [$$[$0]]}; 
break;
case 85:
 this.$ = {selid:"ROOT"};
break;
case 86:
 this.$ = {srchid:"EQ", args: [$$[$0]]}; 
break;
case 87:
 this.$ = {srchid:"LIKE", args: [$$[$0]]}; 
break;
case 88: case 89:
 this.$ = {selid:"WITH", args: $$[$0-1]}; 
break;
case 90:
 this.$ = {srchid:$$[$0-3].toUpperCase(), args:$$[$0-1]}; 
break;
case 91:
 this.$ = {srchid:"WHERE", args:[$$[$0-1]]}; 
break;
case 92:
 this.$ = {srchid:"CLASS", args:[$$[$0-1]]}; 
break;
case 94:
 this.$ = {srchid:"NAME", args: [$$[$0].substr(1,$$[$0].length-2)]}; 
break;
case 95:
 this.$ = {srchid:"CHILD"}; 
break;
case 96:
 this.$ = {srchid:"VERTEX"}; 
break;
case 97:
 this.$ = {srchid:"EDGE"}; 
break;
case 98:
 this.$ = {srchid:"REF"}; 
break;
case 99:
 this.$ = {srchid:"SHARP", args:[$$[$0]]}; 
break;
case 100:
 this.$ = {srchid:"ATTR", args:((typeof $$[$0] == 'undefined')?undefined:[$$[$0]])}; 
break;
case 101:
 this.$ = {srchid:"ATTR"}; 
break;
case 102:
 this.$ = {srchid:"OUT"}; 
break;
case 103:
 this.$ = {srchid:"IN"}; 
break;
case 104:
 this.$ = {srchid:"CONTENT"}; 
break;
case 105:
 this.$ = {srchid:"PARENT"}; 
break;
case 106:
 this.$ = {srchid:"EX",args:[new yy.Json({value:$$[$0]})]}; 
break;
case 107:
 this.$ = {srchid:"AT", args:[$$[$0]]}; 
break;
case 108:
 this.$ = {srchid:"AS", args:[$$[$0]]}; 
break;
case 109:
 this.$ = {srchid:"SET", args:$$[$0-1]}; 
break;
case 110:
 this.$ = {selid:"TO", args:[$$[$0]]}; 
break;
case 111:
 this.$ = {srchid:"VALUE"}; 
break;
case 112:
 this.$ = {srchid:"ROW", args:$$[$0-1]}; 
break;
case 113:
 this.$ = {srchid:"CLASS", args:[$$[$0]]}; 
break;
case 114:
 this.$ = {selid:$$[$0],args:[$$[$0-1]] }; 
break;
case 115:
 this.$ = {selid:"NOT",args:$$[$0-1] }; 
break;
case 116:
 this.$ = {selid:"IF",args:$$[$0-1] }; 
break;
case 117:
 this.$ = {selid:$$[$0-3],args:$$[$0-1] }; 
break;
case 118:
 this.$ = {selid:'DISTINCT',args:$$[$0-1] }; 
break;
case 119:
 this.$ = {selid:'UNION',args:$$[$0-1] }; 
break;
case 120:
 this.$ = {selid:'UNIONALL',args:$$[$0-1] }; 
break;
case 121:
 this.$ = {selid:'ALL',args:[$$[$0-1]] }; 
break;
case 122:
 this.$ = {selid:'ANY',args:[$$[$0-1]] }; 
break;
case 123:
 this.$ = {selid:'INTERSECT',args:$$[$0-1] }; 
break;
case 124:
 this.$ = {selid:'EXCEPT',args:$$[$0-1] }; 
break;
case 125:
 this.$ = {selid:'AND',args:$$[$0-1] }; 
break;
case 126:
 this.$ = {selid:'OR',args:$$[$0-1] }; 
break;
case 127:
 this.$ = {selid:'PATH',args:[$$[$0-1]] }; 
break;
case 128:
 this.$ = {srchid:'RETURN',args:$$[$0-1] }; 
break;
case 129:
 this.$ = {selid:'REPEAT',sels:$$[$0-3], args:$$[$0-1] }; 
break;
case 130:
 this.$ = $$[$0-2]; this.$.push($$[$0]);
break;
case 132:
 this.$ = "PLUS"; 
break;
case 133:
 this.$ = "STAR"; 
break;
case 134:
 this.$ = "QUESTION"; 
break;
case 136:
 this.$ = new yy.Select({ columns:$$[$0], distinct: true }); yy.extend(this.$, $$[$0-3]); yy.extend(this.$, $$[$0-1]); 
break;
case 137:
 this.$ = new yy.Select({ columns:$$[$0], distinct: true }); yy.extend(this.$, $$[$0-3]);yy.extend(this.$, $$[$0-1]); 
break;
case 138:
 this.$ = new yy.Select({ columns:$$[$0], all:true }); yy.extend(this.$, $$[$0-3]);yy.extend(this.$, $$[$0-1]); 
break;
case 139:
 
			if(!$$[$0]) {
				this.$ = new yy.Select({columns:[new yy.Column({columnid:'_',})], modifier:'COLUMN'});
			} else {
				this.$ = new yy.Select({ columns:$$[$0] }); yy.extend(this.$, $$[$0-2]);yy.extend(this.$, $$[$0-1]); 
			}
		
break;
case 140:
 if($$[$0]=='SELECT') this.$ = undefined; else this.$ = {modifier: $$[$0]};  
break;
case 141:
 this.$ = {modifier:'VALUE'}
break;
case 142:
 this.$ = {modifier:'ROW'}
break;
case 143:
 this.$ = {modifier:'COLUMN'}
break;
case 144:
 this.$ = {modifier:'MATRIX'}
break;
case 145:
 this.$ = {modifier:'TEXTSTRING'}
break;
case 146:
 this.$ = {modifier:'INDEX'}
break;
case 147:
 this.$ = {modifier:'RECORDSET'}
break;
case 148:
 this.$ = {top: $$[$0-1], percent:(typeof $$[$0] != 'undefined'?true:undefined)}; 
break;
case 149:
 this.$ = {top: $$[$0-1]}; 
break;
case 151: case 312: case 481: case 482: case 679:
this.$ = undefined; 
break;
case 152: case 153: case 154: case 155:
this.$ = {into: $$[$0]} 
break;
case 156:
 
			var s = $$[$0];
			s = s.substr(1,s.length-2);
			var x3 = s.substr(-3).toUpperCase();
			var x4 = s.substr(-4).toUpperCase();
			if(s[0] == '#') {
				this.$ = {into: new yy.FuncValue({funcid: 'HTML', args:[new yy.StringValue({value: s}), new yy.Json({value:{headers:true}})]})};
			} else if(x3=='XLS' || x3 == 'CSV' || x3=='TAB') {
				this.$ = {into: new yy.FuncValue({funcid: x3, args:[new yy.StringValue({value: s}), new yy.Json({value:{headers:true}})]})};
			} else if(x4=='XLSX' || x4 == 'JSON') {
				this.$ = {into: new yy.FuncValue({funcid: x4, args:[new yy.StringValue({value: s}), new yy.Json({value:{headers:true}})]})};
			}
		
break;
case 157:
 this.$ = { from: $$[$0] }; 
break;
case 158:
 this.$ = { from: $$[$0-1], joins: $$[$0] }; 
break;
case 159:
 this.$ = { from: $$[$0-2], joins: $$[$0-1] }; 
break;
case 161:
 this.$ = new yy.Apply({select: $$[$0-2], applymode:'CROSS', as:$$[$0]}); 
break;
case 162:
 this.$ = new yy.Apply({select: $$[$0-3], applymode:'CROSS', as:$$[$0]}); 
break;
case 163:
 this.$ = new yy.Apply({select: $$[$0-2], applymode:'OUTER', as:$$[$0]}); 
break;
case 164:
 this.$ = new yy.Apply({select: $$[$0-3], applymode:'OUTER', as:$$[$0]}); 
break;
case 166: case 229: case 418: case 488: case 489:
 this.$ = $$[$0-2]; $$[$0-2].push($$[$0]); 
break;
case 167:
 this.$ = $$[$0-2]; this.$.as = $$[$0] 
break;
case 168:
 this.$ = $$[$0-3]; this.$.as = $$[$0] 
break;
case 169:
 this.$ = $$[$0-1]; this.$.as = 'default' 
break;
case 170:
 this.$ = new yy.Json({value:$$[$0-2]}); $$[$0-2].as = $$[$0] 
break;
case 171:
 this.$ = $$[$0-1]; $$[$0-1].as = $$[$0] 
break;
case 172:
 this.$ = $$[$0-2]; $$[$0-2].as = $$[$0] 
break;
case 174: case 178: case 181: case 184:
 this.$ = $$[$0-1]; $$[$0-1].as = $$[$0]; 
break;
case 175: case 179: case 182: case 185:
 this.$ = $$[$0-2]; $$[$0-2].as = $$[$0]; 
break;
case 176: case 177: case 180: case 183:
 this.$ = $$[$0]; $$[$0].as = 'default'; 
break;
case 186:
 
			var s = $$[$0];
			s = s.substr(1,s.length-2);
			var x3 = s.substr(-3).toUpperCase();
			var x4 = s.substr(-4).toUpperCase();
			var r;
			if(s[0] == '#') {
				r = new yy.FuncValue({funcid: 'HTML', args:[new yy.StringValue({value: s}), new yy.Json({value:{headers:true}})]});
			} else if(x3=='XLS' || x3 == 'CSV' || x3=='TAB') {
				r = new yy.FuncValue({funcid: x3, args:[new yy.StringValue({value: s}), new yy.Json({value:{headers:true}})]});
			} else if(x4=='XLSX' || x4 == 'JSON') {
				r = new yy.FuncValue({funcid: x4, args:[new yy.StringValue({value: s}), new yy.Json({value:{headers:true}})]});
			} else {
				throw new Error('Unknown string in FROM clause');
			};
			this.$ = r;
		
break;
case 187:
 	
			if($$[$0-2] == 'INFORMATION_SCHEMA') {
				this.$ = new yy.FuncValue({funcid: $$[$0-2], args:[new yy.StringValue({value:$$[$0]})]});
			} else {
				this.$ = new yy.Table({databaseid: $$[$0-2], tableid:$$[$0]});
			}
		
break;
case 188:
 this.$ = new yy.Table({tableid: $$[$0]});
break;
case 189: case 190:
 this.$ = $$[$0-1]; $$[$0-1].push($$[$0]); 
break;
case 193:
 this.$ = new yy.Join($$[$0-2]); yy.extend(this.$, $$[$0-1]); yy.extend(this.$, $$[$0]); 
break;
case 194:
 this.$ = {table: $$[$0]}; 
break;
case 195:
 this.$ = {table: $$[$0-1], as: $$[$0] } ; 
break;
case 196:
 this.$ = {table: $$[$0-2], as: $$[$0] } ; 
break;
case 197:
 this.$ = {json:new yy.Json({value:$$[$0-2],as:$$[$0]})}; 
break;
case 198:
 this.$ = {param: $$[$0-1], as: $$[$0] } ; 
break;
case 199:
 this.$ = {param: $$[$0-2], as: $$[$0] } ; 
break;
case 200:
 this.$ = {select: $$[$0-3], as: $$[$0]} ; 
break;
case 201:
 this.$ = {select: $$[$0-4], as: $$[$0] } ; 
break;
case 202:
 this.$ = {funcid:$$[$0], as:'default'}; 
break;
case 203:
 this.$ = {funcid:$$[$0-1], as: $$[$0]}; 
break;
case 204:
 this.$ = {funcid:$$[$0-2], as: $$[$0]}; 
break;
case 205:
 this.$ = {variable:$$[$0],as:'default'}; 
break;
case 206:
 this.$ = {variable:$$[$0-1],as:$$[$0]}; 
break;
case 207:
 this.$ = {variable:$$[$0-2],as:$$[$0]} 
break;
case 208:
 this.$ = { joinmode: $$[$0] } ; 
break;
case 209:
 this.$ = {joinmode: $$[$0-1], natural:true} ; 
break;
case 210: case 211:
 this.$ = "INNER"; 
break;
case 212: case 213:
 this.$ = "LEFT"; 
break;
case 214: case 215:
 this.$ = "RIGHT"; 
break;
case 216: case 217:
 this.$ = "OUTER"; 
break;
case 218:
 this.$ = "SEMI"; 
break;
case 219:
 this.$ = "ANTI"; 
break;
case 220:
 this.$ = "CROSS"; 
break;
case 221:
 this.$ = {on: $$[$0]}; 
break;
case 222: case 652:
 this.$ = {using: $$[$0]}; 
break;
case 225:
 this.$ = {where: new yy.Expression({expression:$$[$0]})}; 
break;
case 227:
 this.$ = {group:$$[$0-1]}; yy.extend(this.$,$$[$0]); 
break;
case 230:
 this.$ = new yy.GroupExpression({type:'GROUPING SETS', group: $$[$0-1]}); 
break;
case 231:
 this.$ = new yy.GroupExpression({type:'ROLLUP', group: $$[$0-1]}); 
break;
case 232:
 this.$ = new yy.GroupExpression({type:'CUBE', group: $$[$0-1]}); 
break;
case 235:
 this.$ = {having:$$[$0]}
break;
case 237:
 this.$ = {union: $$[$0]} ; 
break;
case 238:
 this.$ = {unionall: $$[$0]} ; 
break;
case 239:
 this.$ = {except: $$[$0]} ; 
break;
case 240:
 this.$ = {intersect: $$[$0]} ; 
break;
case 241:
 this.$ = {union: $$[$0], corresponding:true} ; 
break;
case 242:
 this.$ = {unionall: $$[$0], corresponding:true} ; 
break;
case 243:
 this.$ = {except: $$[$0], corresponding:true} ; 
break;
case 244:
 this.$ = {intersect: $$[$0], corresponding:true} ; 
break;
case 246:
 this.$ = {order:$$[$0]}
break;
case 248:
 this.$ = $$[$0-2]; $$[$0-2].push($$[$0])
break;
case 249:
 this.$ = new yy.Expression({expression: $$[$0], direction:'ASC'}) 
break;
case 250:
 this.$ = new yy.Expression({expression: $$[$0-1], direction:$$[$0].toUpperCase()}) 
break;
case 251:
 this.$ = new yy.Expression({expression: $$[$0-2], direction:'ASC', nocase:true}) 
break;
case 252:
 this.$ = new yy.Expression({expression: $$[$0-3], direction:$$[$0].toUpperCase(), nocase:true}) 
break;
case 254:
 this.$ = {limit:$$[$0-1]}; yy.extend(this.$, $$[$0]); 
break;
case 255:
 this.$ = {limit:$$[$0-2],offset:$$[$0-6]}; 
break;
case 257:
 this.$ = {offset:$$[$0]}; 
break;
case 258: case 467: case 491: case 606: case 613: case 637: case 639: case 643:
 $$[$0-2].push($$[$0]); this.$ = $$[$0-2]; 
break;
case 260: case 262: case 264:
 $$[$0-2].as = $$[$0]; this.$ = $$[$0-2];
break;
case 261: case 263: case 265:
 $$[$0-1].as = $$[$0]; this.$ = $$[$0-1];
break;
case 267:
 this.$ = new yy.Column({columid: $$[$0], tableid: $$[$0-2], databaseid:$$[$0-4]}); 
break;
case 268:
 this.$ = new yy.Column({columnid: $$[$0], tableid: $$[$0-2]}); 
break;
case 269:
 this.$ = new yy.Column({columnid:$$[$0]}); 
break;
case 270:
 this.$ = new yy.Column({columnid: $$[$0], tableid: $$[$0-2], databaseid:$$[$0-4]});
break;
case 271: case 272:
 this.$ = new yy.Column({columnid: $$[$0], tableid: $$[$0-2]});
break;
case 273:
 this.$ = new yy.Column({columnid: $$[$0]});
break;
case 288:
 this.$ = new yy.Json({value:$$[$0]}); 
break;
case 290: case 291: case 292:

			if(!yy.queries) yy.queries = []; 
			yy.queries.push($$[$0-1]);
			$$[$0-1].queriesidx = yy.queries.length;
			this.$ = $$[$0-1];
		
break;
case 293:
this.$ = $$[$0]
break;
case 294:
 this.$ = new yy.FuncValue({funcid:'CURRENT_TIMESTAMP'});
break;
case 295:
 this.$ = new yy.JavaScript({value:$$[$0].substr(2,$$[$0].length-4)}); 
break;
case 296:
 this.$ = new yy.FuncValue({funcid:$$[$0], newid:true}); 
break;
case 297:
 this.$ = $$[$0]; yy.extend(this.$,{newid:true}); 
break;
case 298:
 this.$ = new yy.Convert({expression:$$[$0-3]}) ; yy.extend(this.$,$$[$0-1]) ; 
break;
case 299:
 this.$ = new yy.Convert({expression:$$[$0-5], style:$$[$0-1]}) ; yy.extend(this.$,$$[$0-3]) ; 
break;
case 300:
 this.$ = new yy.Convert({expression:$$[$0-1]}) ; yy.extend(this.$,$$[$0-3]) ; 
break;
case 301:
 this.$ = new yy.Convert({expression:$$[$0-3], style:$$[$0-1]}) ; yy.extend(this.$,$$[$0-5]) ; 
break;
case 308:
 this.$ = new yy.FuncValue({funcid:'CURRENT_TIMESTAMP'}); 
break;
case 309:

		  if($$[$0-2].length > 1 && ($$[$0-4].toUpperCase() == 'MAX' || $$[$0-4].toUpperCase() == 'MIN')) {
		  	this.$ = new yy.FuncValue({funcid:$$[$0-4],args:$$[$0-2]});
		  } else {
			this.$ = new yy.AggrValue({aggregatorid: $$[$0-4].toUpperCase(), expression: $$[$0-2].pop(), over:$$[$0]}); 
		  } 
		
break;
case 310:
 this.$ = new yy.AggrValue({aggregatorid: $$[$0-5].toUpperCase(), expression: $$[$0-2], distinct:true, over:$$[$0]}); 
break;
case 311:
 this.$ = new yy.AggrValue({aggregatorid: $$[$0-5].toUpperCase(), expression: $$[$0-2],
		 over:$$[$0]}); 
break;
case 313: case 314:
 this.$ = new yy.Over(); yy.extend(this.$,$$[$0-1]); 
break;
case 315:
 this.$ = new yy.Over(); yy.extend(this.$,$$[$0-2]); yy.extend(this.$,$$[$0-1]);
break;
case 316:
 this.$ = {partition:$$[$0]}; 
break;
case 317:
 this.$ = {order:$$[$0]}; 
break;
case 318:
 this.$ = "SUM"; 
break;
case 319:
 this.$ = "COUNT"; 
break;
case 320:
 this.$ = "MIN"; 
break;
case 321: case 503:
 this.$ = "MAX"; 
break;
case 322:
 this.$ = "AVG"; 
break;
case 323:
 this.$ = "FIRST"; 
break;
case 324:
 this.$ = "LAST"; 
break;
case 325:
 this.$ = "AGGR"; 
break;
case 326:
 this.$ = "ARRAY"; 
break;
case 327:
 
			var funcid = $$[$0-4];
			var exprlist = $$[$0-1];
			if(exprlist.length > 1 && (funcid.toUpperCase() == 'MIN' || funcid.toUpperCase() == 'MAX')) {
					this.$ = new yy.FuncValue({funcid: funcid, args: exprlist}); 
			} else if(alasql.aggr[$$[$0-4]]) {
		    	this.$ = new yy.AggrValue({aggregatorid: 'REDUCE', 
                      funcid: funcid, expression: exprlist.pop(),distinct:($$[$0-2]=='DISTINCT') });
		    } else {
			    this.$ = new yy.FuncValue({funcid: funcid, args: exprlist}); 
			};
		
break;
case 328:
 this.$ = new yy.FuncValue({ funcid: $$[$0-2] }) 
break;
case 329:
 this.$ = new yy.FuncValue({ funcid: 'IIF', args:$$[$0-1] }) 
break;
case 331:
 $$[$0-2].push($$[$0]); this.$ = $$[$0-2] 
break;
case 332:
 this.$ = new yy.NumValue({value:+$$[$0]}); 
break;
case 333:
 this.$ = new yy.LogicValue({value:true}); 
break;
case 334:
 this.$ = new yy.LogicValue({value:false}); 
break;
case 335:
 this.$ = new yy.StringValue({value: $$[$0].substr(1,$$[$0].length-2).replace(/(\\\')/g,"'").replace(/(\'\')/g,"'")}); 
break;
case 336:
 this.$ = new yy.StringValue({value: $$[$0].substr(2,$$[$0].length-3).replace(/(\\\')/g,"'").replace(/(\'\')/g,"'")}); 
break;
case 337:
 this.$ = new yy.NullValue({value:undefined}); 
break;
case 338:
 this.$ = new yy.VarValue({variable:$$[$0]}); 
break;
case 339:
 
			if(!yy.exists) yy.exists = [];
			this.$ = new yy.ExistsValue({value:$$[$0-1], existsidx:yy.exists.length}); 
			yy.exists.push($$[$0-1]);
		
break;
case 340: case 341:
 this.$ = new yy.ParamValue({param: $$[$0]}); 
break;
case 342:
 
			if(typeof yy.question == 'undefined') yy.question = 0; 
			this.$ = new yy.ParamValue({param: yy.question++}); 
		
break;
case 343:
 
			if(typeof yy.question == 'undefined') yy.question = 0; 
			this.$ = new yy.ParamValue({param: yy.question++, array:true}); 
		
break;
case 344:
 this.$ = new yy.CaseValue({expression:$$[$0-3], whens: $$[$0-2], elses: $$[$0-1]}); 
break;
case 345:
 this.$ = new yy.CaseValue({whens: $$[$0-2], elses: $$[$0-1]}); 
break;
case 346: case 654: case 655:
 this.$ = $$[$0-1]; this.$.push($$[$0]); 
break;
case 348:
 this.$ = {when: $$[$0-2], then: $$[$0] }; 
break;
case 351:
 this.$ = new yy.Op({left:$$[$0-2], op:'REGEXP', right:$$[$0]}); 
break;
case 352:
 this.$ = new yy.Op({left:$$[$0-2], op:'LIKE', right:$$[$0]}); 
break;
case 353:
 this.$ = new yy.Op({left:$$[$0-4], op:'LIKE', right:$$[$0-2], escape:$$[$0]}); 
break;
case 354:
 this.$ = new yy.Op({left:$$[$0-2], op:'NOT LIKE', right:$$[$0] }); 
break;
case 355:
 this.$ = new yy.Op({left:$$[$0-4], op:'NOT LIKE', right:$$[$0-2], escape:$$[$0] }); 
break;
case 356:
 this.$ = new yy.Op({left:$$[$0-2], op:'+', right:$$[$0]}); 
break;
case 357:
 this.$ = new yy.Op({left:$$[$0-2], op:'-', right:$$[$0]}); 
break;
case 358:
 this.$ = new yy.Op({left:$$[$0-2], op:'*', right:$$[$0]}); 
break;
case 359:
 this.$ = new yy.Op({left:$$[$0-2], op:'/', right:$$[$0]}); 
break;
case 360:
 this.$ = new yy.Op({left:$$[$0-2], op:'%', right:$$[$0]}); 
break;
case 361:
 this.$ = new yy.Op({left:$$[$0-2], op:'^', right:$$[$0]}); 
break;
case 362: case 363: case 365:
 this.$ = new yy.Op({left:$$[$0-2], op:'->' , right:$$[$0]}); 
break;
case 364:
 this.$ = new yy.Op({left:$$[$0-4], op:'->' , right:$$[$0-1]}); 
break;
case 366: case 367: case 369:
 this.$ = new yy.Op({left:$$[$0-2], op:'!' , right:$$[$0]}); 
break;
case 368:
 this.$ = new yy.Op({left:$$[$0-4], op:'!' , right:$$[$0-1]}); 
break;
case 370:
 this.$ = new yy.Op({left:$$[$0-2], op:'>' , right:$$[$0]}); 
break;
case 371:
 this.$ = new yy.Op({left:$$[$0-2], op:'>=' , right:$$[$0]}); 
break;
case 372:
 this.$ = new yy.Op({left:$$[$0-2], op:'<' , right:$$[$0]}); 
break;
case 373:
 this.$ = new yy.Op({left:$$[$0-2], op:'<=' , right:$$[$0]}); 
break;
case 374:
 this.$ = new yy.Op({left:$$[$0-2], op:'=' , right:$$[$0]}); 
break;
case 375:
 this.$ = new yy.Op({left:$$[$0-2], op:'==' , right:$$[$0]}); 
break;
case 376:
 this.$ = new yy.Op({left:$$[$0-2], op:'===' , right:$$[$0]}); 
break;
case 377:
 this.$ = new yy.Op({left:$$[$0-2], op:'!=' , right:$$[$0]}); 
break;
case 378:
 this.$ = new yy.Op({left:$$[$0-2], op:'!==' , right:$$[$0]}); 
break;
case 379:
 this.$ = new yy.Op({left:$$[$0-2], op:'!===' , right:$$[$0]}); 
break;
case 380:
 
			if(!yy.queries) yy.queries = []; 
			this.$ = new yy.Op({left:$$[$0-5], op:$$[$0-4] , allsome:$$[$0-3], right:$$[$0-1], queriesidx: yy.queries.length}); 
			yy.queries.push($$[$0-1]);  
		
break;
case 381:
 
			this.$ = new yy.Op({left:$$[$0-5], op:$$[$0-4] , allsome:$$[$0-3], right:$$[$0-1]}); 
		
break;
case 382:
 
			if($$[$0-2].op == 'BETWEEN1') {

				if($$[$0-2].left.op == 'AND') {
					this.$ = new yy.Op({left:$$[$0-2].left.left,op:'AND',right:
						new yy.Op({left:$$[$0-2].left.right, op:'BETWEEN', 
							right1:$$[$0-2].right, right2:$$[$0]})
					});
				} else {
					this.$ = new yy.Op({left:$$[$0-2].left, op:'BETWEEN', 
						right1:$$[$0-2].right, right2:$$[$0]});
				}

			} else if($$[$0-2].op == 'NOT BETWEEN1') {
				if($$[$0-2].left.op == 'AND') {
					this.$ = new yy.Op({left:$$[$0-2].left.left,op:'AND',right:
						new yy.Op({left:$$[$0-2].left.right, op:'NOT BETWEEN', 
							right1:$$[$0-2].right, right2:$$[$0]})
					});
				} else {
					this.$ = new yy.Op({left:$$[$0-2].left, op:'NOT BETWEEN', 
						right1:$$[$0-2].right, right2:$$[$0]});
				}
			} else {
				this.$ = new yy.Op({left:$$[$0-2], op:'AND', right:$$[$0]});
			}


		
break;
case 383:
 this.$ = new yy.Op({left:$$[$0-2], op:'OR' , right:$$[$0]}); 
break;
case 384:
 this.$ = new yy.UniOp({op:'NOT' , right:$$[$0]}); 
break;
case 385:
 this.$ = new yy.UniOp({op:'-' , right:$$[$0]}); 
break;
case 386:
 this.$ = new yy.UniOp({op:'+' , right:$$[$0]}); 
break;
case 387:
 this.$ = new yy.UniOp({op:'#' , right:$$[$0]}); 
break;
case 388:
 this.$ = new yy.UniOp({right: $$[$0-1]}); 
break;
case 389:
 
			if(!yy.queries) yy.queries = []; 
			this.$ = new yy.Op({left: $$[$0-4], op:'IN', right:$$[$0-1], queriesidx: yy.queries.length});
			yy.queries.push($$[$0-1]);  
		
break;
case 390:
 
			if(!yy.queries) yy.queries = []; 
			this.$ = new yy.Op({left: $$[$0-5], op:'NOT IN', right:$$[$0-1], queriesidx: yy.queries.length});
			yy.queries.push($$[$0-1]);  
		
break;
case 391:
 this.$ = new yy.Op({left: $$[$0-4], op:'IN', right:$$[$0-1]}); 
break;
case 392:
 this.$ = new yy.Op({left: $$[$0-5], op:'NOT IN', right:$$[$0-1]}); 
break;
case 393:
 this.$ = new yy.Op({left: $$[$0-3], op:'IN', right:[]}); 
break;
case 394:
 this.$ = new yy.Op({left: $$[$0-4], op:'NOT IN', right:[]}); 
break;
case 395: case 397:
 this.$ = new yy.Op({left: $$[$0-2], op:'IN', right:$$[$0]}); 
break;
case 396: case 398:
 this.$ = new yy.Op({left: $$[$0-3], op:'NOT IN', right:$$[$0]}); 
break;
case 399:
 	
/*			var expr = $$[$0];
			if(expr.left && expr.left.op == 'AND') {
				this.$ = new yy.Op({left:new yy.Op({left:$$[$0-2], op:'BETWEEN', right:expr.left}), op:'AND', right:expr.right }); 
			} else {
*/
				this.$ = new yy.Op({left:$$[$0-2], op:'BETWEEN1', right:$$[$0] }); 
//			}
		
break;
case 400:

//			var expr = $$[$0];
//			if(expr.left && expr.left.op == 'AND') {
//				this.$ = new yy.Op({left:new yy.Op({left:$$[$0-2], op:'NOT BETWEEN', right:expr.left}), op:'AND', right:expr.right }); 
//			} else {
				this.$ = new yy.Op({left:$$[$0-2], op:'NOT BETWEEN1', right:$$[$0] }); 
//			}
		
break;
case 401:
 this.$ = new yy.Op({op:'IS' , left:$$[$0-2], right:$$[$0]}); 
break;
case 402:
 this.$ = new yy.Convert({expression:$$[$0-2]}) ; yy.extend(this.$,$$[$0]) ; 
break;
case 403: case 404:
 this.$ = $$[$0];
break;
case 405:
 this.$ = $$[$0-1];
break;
case 412:
 this.$ = 'ALL'; 
break;
case 413:
 this.$ = 'SOME'; 
break;
case 414:
 this.$ = 'ANY'; 
break;
case 415:
 this.$ = new yy.Update({table:$$[$0-4], columns:$$[$0-2], where:$$[$0]}); 
break;
case 416:
 this.$ = new yy.Update({table:$$[$0-2], columns:$$[$0]}); 
break;
case 419:
 this.$ = new yy.SetColumn({column:$$[$0-2], expression:$$[$0]})
break;
case 420:
 this.$ = new yy.SetColumn({variable:$$[$0-2], expression:$$[$0], method:$$[$0-3]})
break;
case 421:
 this.$ = new yy.Delete({table:$$[$0-2], where:$$[$0]});
break;
case 422:
 this.$ = new yy.Delete({table:$$[$0]});
break;
case 423:
 this.$ = new yy.Insert({into:$$[$0-2], values: $$[$0]}); 
break;
case 424:
 this.$ = new yy.Insert({into:$$[$0-2], values: $$[$0], orreplace:true}); 
break;
case 425:
 this.$ = new yy.Insert({into:$$[$0-2], default: true}) ; 
break;
case 426:
 this.$ = new yy.Insert({into:$$[$0-5], columns: $$[$0-3], values: $$[$0]}); 
break;
case 427:
 this.$ = new yy.Insert({into:$$[$0-1], select: $$[$0]}); 
break;
case 428:
 this.$ = new yy.Insert({into:$$[$0-1], select: $$[$0], orreplace:true}); 
break;
case 429:
 this.$ = new yy.Insert({into:$$[$0-4], columns: $$[$0-2], select: $$[$0]}); 
break;
case 432:
 this.$ = [$$[$0-1]]; 
break;
case 435:
this.$ = $$[$0-4]; $$[$0-4].push($$[$0-1])
break;
case 436: case 437: case 439: case 447:
this.$ = $$[$0-2]; $$[$0-2].push($$[$0])
break;
case 448:
 
			this.$ = new yy.CreateTable({table:$$[$0-4]}); 
			yy.extend(this.$,$$[$0-7]); 
			yy.extend(this.$,$$[$0-6]); 
			yy.extend(this.$,$$[$0-5]); 
			yy.extend(this.$,$$[$0-2]); 
			yy.extend(this.$,$$[$0]); 
		
break;
case 449:
 
			this.$ = new yy.CreateTable({table:$$[$0]}); 
			yy.extend(this.$,$$[$0-3]); 
			yy.extend(this.$,$$[$0-2]); 
			yy.extend(this.$,$$[$0-1]); 
		
break;
case 451:
 this.$ = {class:true}; 
break;
case 460:
 this.$ = {temporary:true}; 
break;
case 462:
 this.$ = {ifnotexists: true}; 
break;
case 463:
 this.$ = {columns: $$[$0-2], constraints: $$[$0]}; 
break;
case 464:
 this.$ = {columns: $$[$0]}; 
break;
case 465:
 this.$ = {as: $$[$0]} 
break;
case 466: case 490:
 this.$ = [$$[$0]];
break;
case 468: case 469: case 470: case 471: case 472:
 $$[$0].constraintid = $$[$0-1]; this.$ = $$[$0]; 
break;
case 475:
 this.$ = {type: 'CHECK', expression: $$[$0-1]}; 
break;
case 476:
 this.$ = {type: 'PRIMARY KEY', columns: $$[$0-1], clustered:($$[$0-3]+'').toUpperCase()}; 
break;
case 477:
 this.$ = {type: 'FOREIGN KEY', columns: $$[$0-5], fktable: $$[$0-2], fkcolumns: $$[$0-1]}; 
break;
case 483:
 
			this.$ = {type: 'UNIQUE', columns: $$[$0-1], clustered:($$[$0-3]+'').toUpperCase()};
		
break;
case 492:
 this.$ = new yy.ColumnDef({columnid:$$[$0-2]}); yy.extend(this.$,$$[$0-1]); yy.extend(this.$,$$[$0]);
break;
case 493:
 this.$ = new yy.ColumnDef({columnid:$$[$0-1]}); yy.extend(this.$,$$[$0]); 
break;
case 494:
 this.$ = new yy.ColumnDef({columnid:$$[$0], dbtypeid: ''}); 
break;
case 495:
 this.$ = {dbtypeid: $$[$0-5], dbsize: $$[$0-3], dbprecision: +$$[$0-1]} 
break;
case 496:
 this.$ = {dbtypeid: $$[$0-6]+($$[$0-5]?' '+$$[$0-5]:''), dbsize: $$[$0-3], dbprecision: +$$[$0-1]} 
break;
case 497:
 this.$ = {dbtypeid: $$[$0-3], dbsize: $$[$0-1]} 
break;
case 498:
 this.$ = {dbtypeid: $$[$0-4]+($$[$0-3]?' '+$$[$0-3]:''), dbsize: $$[$0-1]} 
break;
case 499:
 this.$ = {dbtypeid: $$[$0]} 
break;
case 500:
 this.$ = {dbtypeid: $$[$0-1]+($$[$0]?' '+$$[$0]:'')} 
break;
case 501:
 this.$ = {dbtypeid: 'ENUM', enumvalues: $$[$0-1]} 
break;
case 502: case 697:
 this.$ = +$$[$0]; 
break;
case 504:
this.$ = undefined
break;
case 506:
 
			yy.extend($$[$0-1],$$[$0]); this.$ = $$[$0-1];
		
break;
case 509:
this.$ = {primarykey:true};
break;
case 510: case 511:
this.$ = {foreignkey:{table:$$[$0-1], columnid: $$[$0]}};
break;
case 512:
 this.$ = {identity: {value:$$[$0-3],step:$$[$0-1]}} 
break;
case 513:
 this.$ = {identity: {value:1,step:1}} 
break;
case 514:
this.$ = {default:$$[$0]};
break;
case 515:
this.$ = {default:$$[$0-1]};
break;
case 516:
this.$ = {null:true}; 
break;
case 517:
this.$ = {notnull:true}; 
break;
case 518:
this.$ = {check:$$[$0]}; 
break;
case 519:
this.$ = {unique:true}; 
break;
case 520:
 this.$ = new yy.DropTable({tables:$$[$0],type:$$[$0-2]}); yy.extend(this.$, $$[$0-1]); 
break;
case 524:
 this.$ = {ifexists: true};
break;
case 525:
 this.$ = new yy.AlterTable({table:$$[$0-3], renameto: $$[$0]});
break;
case 526:
 this.$ = new yy.AlterTable({table:$$[$0-3], addcolumn: $$[$0]});
break;
case 527:
 this.$ = new yy.AlterTable({table:$$[$0-3], modifycolumn: $$[$0]});
break;
case 528:
 this.$ = new yy.AlterTable({table:$$[$0-5], renamecolumn: $$[$0-2], to: $$[$0]});
break;
case 529:
 this.$ = new yy.AlterTable({table:$$[$0-3], dropcolumn: $$[$0]});
break;
case 530:
 this.$ = new yy.AlterTable({table:$$[$0-2], renameto: $$[$0]});
break;
case 531:
 this.$ = new yy.AttachDatabase({databaseid:$$[$0], engineid:$$[$0-2].toUpperCase() });
break;
case 532:
 this.$ = new yy.AttachDatabase({databaseid:$$[$0-3], engineid:$$[$0-5].toUpperCase(), args:$$[$0-1] });
break;
case 533:
 this.$ = new yy.AttachDatabase({databaseid:$$[$0-2], engineid:$$[$0-4].toUpperCase(), as:$$[$0] });
break;
case 534:
 this.$ = new yy.AttachDatabase({databaseid:$$[$0-5], engineid:$$[$0-7].toUpperCase(), as:$$[$0], args:$$[$0-3]});
break;
case 535:
 this.$ = new yy.DetachDatabase({databaseid:$$[$0]});
break;
case 536:
 this.$ = new yy.CreateDatabase({databaseid:$$[$0] }); yy.extend(this.$,$$[$0]); 
break;
case 537:
 this.$ = new yy.CreateDatabase({engineid:$$[$0-4].toUpperCase(), databaseid:$$[$0-1], as:$$[$0] }); yy.extend(this.$,$$[$0-2]); 
break;
case 538:
 this.$ = new yy.CreateDatabase({engineid:$$[$0-7].toUpperCase(), databaseid:$$[$0-4], args:$$[$0-2], as:$$[$0] }); yy.extend(this.$,$$[$0-5]); 
break;
case 539:
 this.$ = new yy.CreateDatabase({engineid:$$[$0-4].toUpperCase(), 
		    as:$$[$0], args:[$$[$0-1]] }); yy.extend(this.$,$$[$0-2]); 
break;
case 540:
this.$ = undefined;
break;
case 542: case 543:
 this.$ = new yy.UseDatabase({databaseid: $$[$0] });
break;
case 544:
 this.$ = new yy.DropDatabase({databaseid: $$[$0] }); yy.extend(this.$,$$[$0-1]); 
break;
case 545: case 546:
 this.$ = new yy.DropDatabase({databaseid: $$[$0], engineid:$$[$0-3].toUpperCase() }); yy.extend(this.$,$$[$0-1]); 
break;
case 547:
 this.$ = new yy.CreateIndex({indexid:$$[$0-5], table:$$[$0-3], columns:$$[$0-1]})
break;
case 548:
 this.$ = new yy.CreateIndex({indexid:$$[$0-5], table:$$[$0-3], columns:$$[$0-1], unique:true})
break;
case 549:
 this.$ = new yy.DropIndex({indexid:$$[$0]});
break;
case 550:
 this.$ = new yy.ShowDatabases();
break;
case 551:
 this.$ = new yy.ShowDatabases({like:$$[$0]});
break;
case 552:
 this.$ = new yy.ShowDatabases({engineid:$$[$0-1].toUpperCase() });
break;
case 553:
 this.$ = new yy.ShowDatabases({engineid:$$[$0-3].toUpperCase() , like:$$[$0]});
break;
case 554:
 this.$ = new yy.ShowTables();
break;
case 555:
 this.$ = new yy.ShowTables({like:$$[$0]});
break;
case 556:
 this.$ = new yy.ShowTables({databaseid: $$[$0]});
break;
case 557:
 this.$ = new yy.ShowTables({like:$$[$0], databaseid: $$[$0-2]});
break;
case 558:
 this.$ = new yy.ShowColumns({table: $$[$0]});
break;
case 559:
 this.$ = new yy.ShowColumns({table: $$[$0-2], databaseid:$$[$0]});
break;
case 560:
 this.$ = new yy.ShowIndex({table: $$[$0]});
break;
case 561:
 this.$ = new yy.ShowIndex({table: $$[$0-2], databaseid: $$[$0]});
break;
case 562:
 this.$ = new yy.ShowCreateTable({table: $$[$0]});
break;
case 563:
 this.$ = new yy.ShowCreateTable({table: $$[$0-2], databaseid:$$[$0]});
break;
case 564:

			this.$ = new yy.CreateTable({table:$$[$0-6],view:true,select:$$[$0-1],viewcolumns:$$[$0-4]}); 
			yy.extend(this.$,$$[$0-9]); 
			yy.extend(this.$,$$[$0-7]); 
		
break;
case 565:
 
			this.$ = new yy.CreateTable({table:$$[$0-3],view:true,select:$$[$0-1]}); 
			yy.extend(this.$,$$[$0-6]); 
			yy.extend(this.$,$$[$0-4]); 
		
break;
case 569:
 this.$ = new yy.DropTable({tables:$$[$0], view:true}); yy.extend(this.$, $$[$0-1]); 
break;
case 570:
 this.$ = new yy.Help({subject:$$[$0].value.toUpperCase()} ) ; 
break;
case 571:
 this.$ = new yy.Help() ; 
break;
case 572:
 this.$ = new yy.ExpressionStatement({expression:$$[$0]}); 
break;
case 573:
 this.$ = new yy.Source({url:$$[$0].value}); 
break;
case 574:
 this.$ = new yy.Assert({value:$$[$0]}); 
break;
case 575:
 this.$ = new yy.Assert({value:$$[$0].value}); 
break;
case 576:
 this.$ = new yy.Assert({value:$$[$0], message:$$[$0-2]}); 
break;
case 578: case 589: case 591:
 this.$ = $$[$0].value; 
break;
case 579: case 587:
 this.$ = +$$[$0].value; 
break;
case 580:
 this.$ = (!!$$[$0].value); 
break;
case 588:
 this.$ = ""+$$[$0].value; 
break;
case 594:
 this.$ = $$[$0-1]
break;
case 596: case 599:
 this.$ = $$[$0-2]; 
break;
case 597:
 this.$ = {}; 
break;
case 600:
 this.$ = []; 
break;
case 601:
 yy.extend($$[$0-2],$$[$0]); this.$ = $$[$0-2]; 
break;
case 603:
 this.$ = {}; this.$[$$[$0-2].substr(1,$$[$0-2].length-2)] = $$[$0]; 
break;
case 604: case 605:
 this.$ = {}; this.$[$$[$0-2]] = $$[$0]; 
break;
case 608:
 this.$ = new yy.SetVariable({variable:$$[$0-1].toLowerCase(), value:$$[$0]});
break;
case 609:
 this.$ = new yy.SetVariable({variable:$$[$0-2], expression:$$[$0], method:$$[$0-3]});
break;
case 610:
 this.$ = new yy.SetVariable({variable:$$[$0-3], props: $$[$0-2], expression:$$[$0], method:$$[$0-4]});
break;
case 611:
this.$ = '@'; 
break;
case 612:
this.$ = '$'; 
break;
case 618:
 this.$ = true; 
break;
case 619:
 this.$ = false; 
break;
case 620:
 this.$ = new yy.CommitTransaction(); 
break;
case 621:
 this.$ = new yy.RollbackTransaction(); 
break;
case 622:
 this.$ = new yy.BeginTransaction(); 
break;
case 623:
 this.$ = new yy.If({expression:$$[$0-2],thenstat:$$[$0-1], elsestat:$$[$0]}); 
			if($$[$0-1].exists) this.$.exists = $$[$0-1].exists;
			if($$[$0-1].queries) this.$.queries = $$[$0-1].queries;
		
break;
case 624:
 
			this.$ = new yy.If({expression:$$[$0-1],thenstat:$$[$0]}); 
			if($$[$0].exists) this.$.exists = $$[$0].exists;
			if($$[$0].queries) this.$.queries = $$[$0].queries;
		
break;
case 625:
this.$ = $$[$0];
break;
case 626:
 this.$ = new yy.While({expression:$$[$0-1],loopstat:$$[$0]}); 
			if($$[$0].exists) this.$.exists = $$[$0].exists;
			if($$[$0].queries) this.$.queries = $$[$0].queries;
		
break;
case 627:
 this.$ = new yy.Continue(); 
break;
case 628:
 this.$ = new yy.Break(); 
break;
case 629:
 this.$ = new yy.BeginEnd({statements:$$[$0-1]}); 
break;
case 630:
 this.$ = new yy.Print({exprs:$$[$0]});
break;
case 631:
 this.$ = new yy.Print({select:$$[$0]});
break;
case 632:
 this.$ = new yy.Require({paths:$$[$0]}); 
break;
case 633:
 this.$ = new yy.Require({plugins:$$[$0]}); 
break;
case 634: case 635:
this.$ = $$[$0].toUpperCase(); 
break;
case 636:
 this.$ = new yy.Echo({expr:$$[$0]}); 
break;
case 641:
 this.$ = new yy.Declare({declares:$$[$0]}); 
break;
case 644:
 this.$ = {variable: $$[$0-1]}; yy.extend(this.$,$$[$0]); 
break;
case 645:
 this.$ = {variable: $$[$0-2]}; yy.extend(this.$,$$[$0]); 
break;
case 646:
 this.$ = {variable: $$[$0-3], expression:$$[$0]}; yy.extend(this.$,$$[$0-2]);
break;
case 647:
 this.$ = {variable: $$[$0-4], expression:$$[$0]}; yy.extend(this.$,$$[$0-2]);
break;
case 648:
 this.$ = new yy.TruncateTable({table:$$[$0]});
break;
case 649:
 
			this.$ = new yy.Merge(); yy.extend(this.$,$$[$0-4]); yy.extend(this.$,$$[$0-3]); 
			yy.extend(this.$,$$[$0-2]);
			yy.extend(this.$,{matches:$$[$0-1]});yy.extend(this.$,$$[$0]);
		
break;
case 650: case 651:
 this.$ = {into: $$[$0]}; 
break;
case 653:
 this.$ = {on:$$[$0]}; 
break;
case 658:
 this.$ = {matched:true, action:$$[$0]} 
break;
case 659:
 this.$ = {matched:true, expr: $$[$0-2], action:$$[$0]} 
break;
case 660:
 this.$ = {delete:true}; 
break;
case 661:
 this.$ = {update:$$[$0]}; 
break;
case 662: case 663:
 this.$ = {matched:false, bytarget: true, action:$$[$0]} 
break;
case 664: case 665:
 this.$ = {matched:false, bytarget: true, expr:$$[$0-2], action:$$[$0]} 
break;
case 666:
 this.$ = {matched:false, bysource: true, action:$$[$0]} 
break;
case 667:
 this.$ = {matched:false, bysource: true, expr:$$[$0-2], action:$$[$0]} 
break;
case 668:
 this.$ = {insert:true, values:$$[$0]}; 
break;
case 669:
 this.$ = {insert:true, values:$$[$0], columns:$$[$0-3]}; 
break;
case 670:
 this.$ = {insert:true, defaultvalues:true}; 
break;
case 671:
 this.$ = {insert:true, defaultvalues:true, columns:$$[$0-3]}; 
break;
case 673:
 this.$ = {output:{columns:$$[$0]}} 
break;
case 674:
 this.$ = {output:{columns:$$[$0-3], intovar: $$[$0], method:$$[$0-1]}} 
break;
case 675:
 this.$ = {output:{columns:$$[$0-2], intotable: $$[$0]}} 
break;
case 676:
 this.$ = {output:{columns:$$[$0-5], intotable: $$[$0-3], intocolumns:$$[$0-1]}} 
break;
case 677:

			this.$ = new yy.CreateVertex({class:$$[$0-3],sharp:$$[$0-2], name:$$[$0-1]}); 
			yy.extend(this.$,$$[$0]); 
		
break;
case 680:
 this.$ = {sets:$$[$0]}; 
break;
case 681:
 this.$ = {content:$$[$0]}; 
break;
case 682:
 this.$ = {select:$$[$0]}; 
break;
case 683:

			this.$ = new yy.CreateEdge({from:$$[$0-3],to:$$[$0-1],name:$$[$0-5]});
			yy.extend(this.$,$$[$0]); 
		
break;
case 684:
 this.$ = new yy.CreateGraph({graph:$$[$0]}); 
break;
case 685:
 this.$ = new yy.CreateGraph({from:$$[$0]}); 
break;
case 688:
 
			this.$ = $$[$0-2]; 
			if($$[$0-1]) this.$.json = new yy.Json({value:$$[$0-1]});
			if($$[$0]) this.$.as = $$[$0];
		
break;
case 689:
 
			this.$ = {source:$$[$0-6], target: $$[$0]};
			if($$[$0-3]) this.$.json = new yy.Json({value:$$[$0-3]});
			if($$[$0-2]) this.$.as = $$[$0-2];
			yy.extend(this.$,$$[$0-4]);
			;
		
break;
case 691:
 this.$ = {vars:$$[$0], method:$$[$0-1]}; 
break;
case 694:
 
			var s3 = $$[$0-1];
			this.$ = {prop:$$[$0-3], sharp:$$[$0-2], name:(typeof s3 == 'undefined')?undefined:s3.substr(1,s3.length-2), class:$$[$0]}; 
		
break;
case 700:
 this.$ = new yy.AddRule({left:$$[$0-2], right:$$[$0]}); 
break;
case 701:
 this.$ = new yy.AddRule({right:$$[$0]}); 
break;
case 704:
 this.$ = new yy.Term({termid:$$[$0]}); 
break;
case 705:
 this.$ = new yy.Term({termid:$$[$0-3],args:$$[$0-1]}); 
break;
case 714: case 734: case 736: case 738: case 742: case 744: case 746: case 748: case 750: case 752:
this.$ = [];
break;
case 715: case 729: case 731: case 735: case 737: case 739: case 743: case 745: case 747: case 749: case 751: case 753:
$$[$0-1].push($$[$0]);
break;
case 728: case 730:
this.$ = [$$[$0]];
break;
}
},
table: [o([8,473,474],$V0,{6:1,7:2,10:3,11:4,15:5,16:7,17:8,18:9,19:10,20:11,21:12,22:13,23:14,24:15,25:16,26:17,27:18,28:19,29:20,30:21,31:22,32:23,33:24,34:25,35:26,36:27,37:28,38:29,39:30,40:31,41:32,42:33,43:34,44:35,45:36,46:37,47:38,49:40,50:41,51:42,52:43,53:44,54:45,55:46,56:47,57:48,58:49,59:50,60:51,61:52,62:53,63:54,64:55,65:56,73:69,468:90,173:94,3:95,4:$V1,5:$V2,12:$V3,48:$V4,66:$V5,83:$V6,115:$V7,135:$V8,145:$V9,178:$Va,252:$Vb,307:$Vc,310:$Vd,311:$Ve,319:$Vf,365:$Vg,369:$Vh,370:$Vi,373:$Vj,375:$Vk,377:$Vl,378:$Vm,386:$Vn,387:$Vo,388:$Vp,405:$Vq,407:$Vr,408:$Vs,410:$Vt,411:$Vu,412:$Vv,413:$Vw,414:$Vx,418:$Vy,419:$Vz,422:$VA,423:$VB,469:$VC,471:$VD,472:$VE}),{1:[3]},{8:[1,99],9:100,473:$VF,474:$VG},o($VH,[2,5]),o($VH,[2,6]),o($VI,[2,9]),o($VH,$V0,{15:5,16:7,17:8,18:9,19:10,20:11,21:12,22:13,23:14,24:15,25:16,26:17,27:18,28:19,29:20,30:21,31:22,32:23,33:24,34:25,35:26,36:27,37:28,38:29,39:30,40:31,41:32,42:33,43:34,44:35,45:36,46:37,47:38,49:40,50:41,51:42,52:43,53:44,54:45,55:46,56:47,57:48,58:49,59:50,60:51,61:52,62:53,63:54,64:55,65:56,73:69,468:90,173:94,3:95,10:103,4:$V1,5:$V2,13:[1,104],48:$V4,66:$V5,83:$V6,115:$V7,135:$V8,145:$V9,178:$Va,252:$Vb,307:$Vc,310:$Vd,311:$Ve,319:$Vf,365:$Vg,369:$Vh,370:$Vi,373:$Vj,375:$Vk,377:$Vl,378:$Vm,386:$Vn,387:$Vo,388:$Vp,405:$Vq,407:$Vr,408:$Vs,410:$Vt,411:$Vu,412:$Vv,413:$Vw,414:$Vx,418:$Vy,419:$Vz,422:$VA,423:$VB,469:$VC,471:$VD,472:$VE}),o($VI,[2,11]),o($VI,[2,12]),o($VI,[2,13]),o($VI,[2,14]),o($VI,[2,15]),o($VI,[2,16]),o($VI,[2,17]),o($VI,[2,18]),o($VI,[2,19]),o($VI,[2,20]),o($VI,[2,21]),o($VI,[2,22]),o($VI,[2,23]),o($VI,[2,24]),o($VI,[2,25]),o($VI,[2,26]),o($VI,[2,27]),o($VI,[2,28]),o($VI,[2,29]),o($VI,[2,30]),o($VI,[2,31]),o($VI,[2,32]),o($VI,[2,33]),o($VI,[2,34]),o($VI,[2,35]),o($VI,[2,36]),o($VI,[2,37]),o($VI,[2,38]),o($VI,[2,39]),o($VI,[2,40]),o($VI,[2,41]),o($VI,[2,42]),o($VI,[2,43]),o($VI,[2,44]),o($VI,[2,45]),o($VI,[2,46]),o($VI,[2,47]),o($VI,[2,48]),o($VI,[2,49]),o($VI,[2,50]),o($VI,[2,51]),o($VI,[2,52]),o($VI,[2,53]),o($VI,[2,54]),o($VI,[2,55]),o($VI,[2,56]),o($VI,[2,57]),o($VI,[2,58]),o($VI,[2,59]),o($VI,[2,60]),{325:[1,105]},{3:106,4:$V1,5:$V2},{3:108,4:$V1,5:$V2,145:$VJ,189:107},o($VK,[2,459],{3:111,320:115,4:$V1,5:$V2,124:$VL,125:$VM,176:[1,113],182:[1,112],329:[1,118],374:[1,110],443:[1,114]}),{134:$VN,420:119,421:120},{172:[1,122]},{374:[1,123]},{3:125,4:$V1,5:$V2,120:[1,130],182:[1,126],325:[1,129],366:127,374:[1,124],379:[1,128]},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:131,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($Vk1,$Vl1,{312:186,160:[1,187],187:$Vm1}),{3:199,4:$V1,5:$V2,71:$Vn1,122:$Vo1,131:$VS,133:193,134:$VT,141:$VU,145:$VJ,170:$VY,187:[1,191],188:194,189:196,190:195,191:197,198:190,201:198,279:$Vf1,389:173,390:$Vi1,394:$Vj1,424:189},{325:[1,201]},o($Vp1,[2,710],{74:202,100:203,101:[1,204]}),o($Vq1,[2,714],{84:205}),{3:209,4:$V1,5:$V2,179:[1,207],182:[1,210],319:[1,206],325:[1,211],374:[1,208]},{325:[1,212]},{3:215,4:$V1,5:$V2,67:213,69:214},o([283,473,474],$V0,{10:3,11:4,15:5,16:7,17:8,18:9,19:10,20:11,21:12,22:13,23:14,24:15,25:16,26:17,27:18,28:19,29:20,30:21,31:22,32:23,33:24,34:25,35:26,36:27,37:28,38:29,39:30,40:31,41:32,42:33,43:34,44:35,45:36,46:37,47:38,49:40,50:41,51:42,52:43,53:44,54:45,55:46,56:47,57:48,58:49,59:50,60:51,61:52,62:53,63:54,64:55,65:56,73:69,468:90,173:94,3:95,7:217,4:$V1,5:$V2,12:$V3,48:$V4,66:$V5,83:$V6,115:$V7,135:$V8,145:$V9,178:$Va,252:$Vb,307:$Vc,310:$Vd,311:$Ve,319:$Vf,365:$Vg,369:$Vh,370:$Vi,373:$Vj,375:$Vk,377:$Vl,378:$Vm,386:$Vn,387:$Vo,388:$Vp,405:$Vq,406:[1,216],407:$Vr,408:$Vs,410:$Vt,411:$Vu,412:$Vv,413:$Vw,414:$Vx,418:$Vy,419:$Vz,422:$VA,423:$VB,469:$VC,471:$VD,472:$VE}),{406:[1,218]},{406:[1,219]},{3:221,4:$V1,5:$V2,374:[1,220]},{3:223,4:$V1,5:$V2,188:222},o($VI,[2,571],{107:224,122:$VQ,275:$Vc1}),o($Vr1,[2,295]),{107:225,122:$VQ,275:$Vc1},{3:108,4:$V1,5:$V2,107:231,121:$VP,122:[1,228],131:$VS,133:226,134:$Vs1,141:$VU,145:$VJ,170:$VY,185:230,189:235,190:234,244:232,245:233,251:$Vt1,257:227,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,279:$Vf1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:237,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($VI,[2,627]),o($VI,[2,628]),{3:152,4:$V1,5:$V2,37:239,52:149,71:$VO,73:69,83:$V6,88:240,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,140:238,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,173:94,178:$Va,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:246,4:$V1,5:$V2,107:243,122:$VQ,275:$Vc1,415:241,416:242,417:244,418:$Vu1},{3:247,4:$V1,5:$V2,131:$Vv1,134:$Vw1,401:248},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:251,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{469:[1,252]},{3:95,4:$V1,5:$V2,468:254,470:253},{3:108,4:$V1,5:$V2,145:$VJ,189:255},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:256,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($Vx1,$Vy1,{175:260,153:[1,259],174:[1,257],176:[1,258],184:$Vz1}),o($VA1,[2,704],{71:[1,262]}),o($VB1,[2,140],{138:[1,263],139:[1,264],179:[1,265],180:[1,266],181:[1,267],182:[1,268],183:[1,269]}),o($VC1,[2,1]),o($VC1,[2,2]),{1:[2,3]},o($VH,$V0,{15:5,16:7,17:8,18:9,19:10,20:11,21:12,22:13,23:14,24:15,25:16,26:17,27:18,28:19,29:20,30:21,31:22,32:23,33:24,34:25,35:26,36:27,37:28,38:29,39:30,40:31,41:32,42:33,43:34,44:35,45:36,46:37,47:38,49:40,50:41,51:42,52:43,53:44,54:45,55:46,56:47,57:48,58:49,59:50,60:51,61:52,62:53,63:54,64:55,65:56,73:69,468:90,173:94,3:95,10:270,4:$V1,5:$V2,48:$V4,66:$V5,83:$V6,115:$V7,135:$V8,145:$V9,178:$Va,252:$Vb,307:$Vc,310:$Vd,311:$Ve,319:$Vf,365:$Vg,369:$Vh,370:$Vi,373:$Vj,375:$Vk,377:$Vl,378:$Vm,386:$Vn,387:$Vo,388:$Vp,405:$Vq,407:$Vr,408:$Vs,410:$Vt,411:$Vu,412:$Vv,413:$Vw,414:$Vx,418:$Vy,419:$Vz,422:$VA,423:$VB,469:$VC,471:$VD,472:$VE}),o($VD1,[2,708]),o($VD1,[2,709]),o($VH,[2,7]),{14:[1,271]},{3:223,4:$V1,5:$V2,188:272},{374:[1,273]},o($VI,[2,707]),{71:$VE1},{71:[1,275]},o($Vk1,$VF1,{322:276,145:$VG1}),{374:[1,278]},{3:279,4:$V1,5:$V2},{182:[1,280]},o([8,68,70,122,127,129,141,283,287,390,394,473,474],$VH1,{444:281,445:283,446:284,449:285,3:286,456:287,453:288,401:289,4:$V1,5:$V2,131:$Vv1,134:$Vw1,172:[1,282]}),{120:[1,293],321:290,325:[1,292],379:[1,291]},{107:295,122:$VQ,172:[2,806],275:$Vc1,442:294},o($VI1,[2,800],{436:296,3:297,4:$V1,5:$V2}),o($VK,[2,460]),o($VI,[2,641],{68:[1,298]}),o($VJ1,[2,642]),{3:299,4:$V1,5:$V2},{3:223,4:$V1,5:$V2,188:300},{3:301,4:$V1,5:$V2},o($Vk1,$VK1,{367:302,145:$VL1}),{374:[1,304]},{3:305,4:$V1,5:$V2},o($Vk1,$VK1,{367:306,145:$VL1}),o($Vk1,$VK1,{367:307,145:$VL1}),o($VM1,[2,794]),o($VM1,[2,795]),o($VI,$V0,{15:5,16:7,17:8,18:9,19:10,20:11,21:12,22:13,23:14,24:15,25:16,26:17,27:18,28:19,29:20,30:21,31:22,32:23,33:24,34:25,35:26,36:27,37:28,38:29,39:30,40:31,41:32,42:33,43:34,44:35,45:36,46:37,47:38,49:40,50:41,51:42,52:43,53:44,54:45,55:46,56:47,57:48,58:49,59:50,60:51,61:52,62:53,63:54,64:55,65:56,73:69,468:90,173:94,3:95,10:308,299:330,4:$V1,5:$V2,48:$V4,66:$V5,83:$V6,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$VR1,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,135:$V8,143:$VX1,145:$V9,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,178:$Va,252:$Vb,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2,307:$Vc,310:$Vd,311:$Ve,319:$Vf,365:$Vg,369:$Vh,370:$Vi,373:$Vj,375:$Vk,377:$Vl,378:$Vm,386:$Vn,387:$Vo,388:$Vp,405:$Vq,407:$Vr,408:$Vs,410:$Vt,411:$Vu,412:$Vv,413:$Vw,414:$Vx,418:$Vy,419:$Vz,422:$VA,423:$VB,469:$VC,471:$VD,472:$VE}),o($Vr1,[2,274]),o($Vr1,[2,275]),o($Vr1,[2,276]),o($Vr1,[2,277]),o($Vr1,[2,278]),o($Vr1,[2,279]),o($Vr1,[2,280]),o($Vr1,[2,281]),o($Vr1,[2,282]),o($Vr1,[2,283]),o($Vr1,[2,284]),o($Vr1,[2,285]),o($Vr1,[2,286]),o($Vr1,[2,287]),o($Vr1,[2,288]),o($Vr1,[2,289]),{3:152,4:$V1,5:$V2,24:344,25:343,34:340,37:339,52:149,71:$VO,73:69,83:$V6,88:342,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,173:94,178:$Va,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,250:341,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,311:$Ve,319:[1,345],389:173,390:$Vi1,394:$Vj1},o($Vr1,[2,293]),o($Vr1,[2,294]),{71:[1,346]},o([4,5,8,48,66,68,70,72,83,87,89,92,93,101,106,109,113,114,115,119,120,121,122,123,124,125,126,127,128,129,130,131,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,168,169,170,172,174,176,178,187,195,197,209,210,211,212,213,214,215,216,219,226,229,230,232,234,252,263,264,265,266,267,268,269,270,271,275,283,285,286,287,288,289,290,291,292,293,294,295,296,297,298,302,303,304,305,307,310,311,319,365,369,370,373,375,377,378,386,387,388,390,394,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474],$Ve2,{71:$VE1,132:[1,347]}),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:348,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:349,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:350,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:351,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($Vr1,[2,269]),o([4,5,8,48,66,68,70,71,72,83,87,89,92,93,101,106,109,113,114,115,119,120,121,122,123,124,125,126,127,128,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,168,169,170,172,174,176,178,187,195,197,209,210,211,212,213,214,215,216,217,218,219,226,229,230,232,234,236,251,252,253,254,256,263,264,265,266,267,268,269,270,271,273,274,275,276,277,279,280,283,285,286,287,288,289,290,291,292,293,294,295,296,297,298,302,303,304,305,307,310,311,315,319,328,340,341,345,346,365,369,370,373,375,377,378,384,386,387,388,390,394,396,398,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474,475,476],[2,332]),o($Vf2,[2,333]),o($Vf2,[2,334]),o($Vf2,$Vg2),o($Vf2,[2,336]),o([4,5,8,48,66,68,70,71,72,83,87,89,92,93,101,106,109,113,114,115,119,120,121,122,123,124,125,126,127,128,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,168,169,170,172,174,176,178,187,195,197,209,210,211,212,213,214,215,216,219,226,229,230,232,234,252,263,264,265,266,267,268,269,270,271,275,276,283,285,286,287,288,289,290,291,292,293,294,295,296,297,298,302,303,304,305,307,310,311,315,319,328,340,341,345,346,365,369,370,373,375,377,378,386,387,388,390,394,396,398,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474],[2,337]),{3:353,4:$V1,5:$V2,121:[1,354],278:352},{3:355,4:$V1,5:$V2},o($Vf2,[2,342]),o($Vf2,[2,343]),{3:356,4:$V1,5:$V2,71:$Vh2,107:358,121:$VP,122:$VQ,131:$VS,141:$VU,170:$VY,185:359,190:361,244:360,273:$Va1,274:$Vb1,275:$Vc1,279:$Vf1,389:362,394:$Vj1},{71:[1,363]},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:364,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,281:365,284:366,285:$Vi2,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{71:[1,368]},{71:[1,369]},o($Vj2,[2,582]),{3:384,4:$V1,5:$V2,71:$Vk2,105:379,107:377,121:$VP,122:$VQ,131:$VS,133:374,134:$Vs1,141:$VU,145:$VJ,170:$VY,185:376,189:382,190:381,244:378,245:380,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,279:$Vf1,389:173,390:$Vi1,391:370,392:373,393:375,394:$Vj1,397:371,398:[1,372]},{3:385,4:$V1,5:$V2,145:$VJ,189:386},{71:[2,318]},{71:[2,319]},{71:[2,320]},{71:[2,321]},{71:[2,322]},{71:[2,323]},{71:[2,324]},{71:[2,325]},{71:[2,326]},{3:392,4:$V1,5:$V2,121:$Vl2,122:$Vm2,395:387,396:[1,388],399:389},{3:223,4:$V1,5:$V2,188:393},{314:[1,394]},o($Vk1,[2,431]),{218:[1,396],425:395},{218:[2,650]},{3:199,4:$V1,5:$V2,71:$Vn1,122:$Vo1,131:$VS,133:193,134:$VT,141:$VU,145:$VJ,170:$VY,188:194,189:196,190:195,191:197,198:397,201:198,279:$Vf1,389:173,390:$Vi1,394:$Vj1},{37:398,73:69,83:$V6,173:94,178:$Va},o($Vn2,[2,758],{199:399,70:[1,400]}),o($Vo2,[2,173],{3:401,4:$V1,5:$V2,70:[1,402]}),o($Vo2,[2,176],{3:403,4:$V1,5:$V2,70:[1,404]}),o($Vo2,[2,177],{3:405,4:$V1,5:$V2,70:[1,406]}),o($Vo2,[2,180],{3:407,4:$V1,5:$V2,70:[1,408]}),o($Vo2,[2,183],{3:409,4:$V1,5:$V2,70:[1,410]}),o([4,5,8,66,68,70,72,87,92,109,119,151,157,158,172,195,197,209,210,211,212,213,214,215,216,217,218,219,232,234,283,287,473,474],$Vp2,{71:$VE1,132:$Vq2}),o([4,5,8,66,68,70,72,87,92,109,119,151,157,158,195,197,209,210,211,212,213,214,215,216,217,218,219,232,234,283,287,473,474],[2,186]),{3:223,4:$V1,5:$V2,188:412},o($Vr2,$Vs2,{75:413,187:$Vt2}),o($Vp1,[2,711]),o($Vu2,[2,724],{102:415,179:[1,416]}),o([8,72,172,283,287,473,474],$Vs2,{389:173,75:417,108:418,3:419,133:441,147:451,149:452,4:$V1,5:$V2,66:$Vv2,70:$Vw2,71:$Vx2,106:$Vy2,109:$Vz2,113:$VA2,114:$VB2,115:$VC2,119:$VD2,120:$VE2,121:$VF2,122:$VG2,123:$VH2,124:$VI2,125:$VJ2,126:$VK2,127:$VL2,128:$VM2,129:$VN2,130:$VO2,131:$VP2,132:$VQ2,134:$VR2,135:$VS2,137:$VT2,138:$VU2,139:$VV2,141:$VW2,143:$VX2,145:$VY2,151:$VZ2,153:$V_2,155:$V$2,157:$V03,158:$V13,159:$V23,160:$V33,161:$V43,162:$V53,164:$V63,174:$V73,176:$V83,187:$Vt2,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,390:$Vi1,394:$Vj1}),{325:[1,465]},{172:[1,466]},o($VI,[2,550],{106:[1,467]}),{374:[1,468]},{172:[1,469]},o($VI,[2,554],{106:[1,470],172:[1,471]}),{3:223,4:$V1,5:$V2,188:472},{37:473,68:[1,474],73:69,83:$V6,173:94,178:$Va},o($V93,[2,63]),{70:[1,475]},o($VI,[2,622]),{9:100,283:[1,476],473:$VF,474:$VG},o($VI,[2,620]),o($VI,[2,621]),{3:477,4:$V1,5:$V2},o($VI,[2,543]),{135:[1,478]},o([8,68,70,71,72,83,119,135,137,138,143,172,176,178,217,276,283,287,315,328,340,341,345,346,365,370,371,372,473,474],$Vp2,{132:$Vq2}),o($VI,[2,570]),o($VI,[2,573]),o($VI,[2,574]),o($VI,[2,575]),o($VI,$Vg2,{68:[1,479]}),{71:$Vh2,107:358,121:$VP,122:$VQ,131:$VS,141:$VU,170:$VY,185:359,190:361,244:360,273:$Va1,274:$Vb1,275:$Vc1,279:$Vf1,389:362,394:$Vj1},o($Va3,[2,302]),o($Va3,[2,303]),o($Va3,[2,304]),o($Va3,[2,305]),o($Va3,[2,306]),o($Va3,[2,307]),o($Va3,[2,308]),o($VI,$V0,{15:5,16:7,17:8,18:9,19:10,20:11,21:12,22:13,23:14,24:15,25:16,26:17,27:18,28:19,29:20,30:21,31:22,32:23,33:24,34:25,35:26,36:27,37:28,38:29,39:30,40:31,41:32,42:33,43:34,44:35,45:36,46:37,47:38,49:40,50:41,51:42,52:43,53:44,54:45,55:46,56:47,57:48,58:49,59:50,60:51,61:52,62:53,63:54,64:55,65:56,73:69,468:90,173:94,3:95,299:330,10:480,4:$V1,5:$V2,48:$V4,66:$V5,83:$V6,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$VR1,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,135:$V8,143:$VX1,145:$V9,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,178:$Va,252:$Vb,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2,307:$Vc,310:$Vd,311:$Ve,319:$Vf,365:$Vg,369:$Vh,370:$Vi,373:$Vj,375:$Vk,377:$Vl,378:$Vm,386:$Vn,387:$Vo,388:$Vp,405:$Vq,407:$Vr,408:$Vs,410:$Vt,411:$Vu,412:$Vv,413:$Vw,414:$Vx,418:$Vy,419:$Vz,422:$VA,423:$VB,469:$VC,471:$VD,472:$VE}),o($VI,[2,630],{68:$Vb3}),o($VI,[2,631]),o($Vc3,[2,330],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),o($VI,[2,632],{68:[1,483]}),o($VI,[2,633],{68:[1,484]}),o($VJ1,[2,638]),o($VJ1,[2,640]),o($VJ1,[2,634]),o($VJ1,[2,635]),{217:[1,486],400:485,404:[1,487]},{3:488,4:$V1,5:$V2},o($Vk1,[2,611]),o($Vk1,[2,612]),o($VI,[2,572],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),{3:95,4:$V1,5:$V2,468:254,470:489},o($VI,[2,701],{68:$Ve3}),o($Vc3,[2,703]),o($VI,[2,706]),o($VI,[2,636],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),o($Vf3,$Vy1,{175:491,184:$Vz1}),o($Vf3,$Vy1,{175:492,184:$Vz1}),o($Vf3,$Vy1,{175:493,184:$Vz1}),o($Vg3,[2,754],{242:132,189:133,243:134,105:135,241:136,185:137,244:138,107:139,245:140,190:141,191:142,246:143,247:144,248:145,133:146,249:147,52:149,147:151,3:152,389:173,177:494,163:495,240:496,88:497,4:$V1,5:$V2,71:$VO,121:$VP,122:$VQ,127:$VR,131:$VS,134:$VT,141:$VU,143:$VV,145:$VJ,168:$VW,169:$VX,170:$VY,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,390:$Vi1,394:$Vj1}),{71:[1,499],121:$VP,185:498},{3:95,4:$V1,5:$V2,468:254,470:500},o($VB1,[2,141]),o($VB1,[2,142]),o($VB1,[2,143]),o($VB1,[2,144]),o($VB1,[2,145]),o($VB1,[2,146]),o($VB1,[2,147]),o($VH,[2,4]),o($VH,$V0,{15:5,16:7,17:8,18:9,19:10,20:11,21:12,22:13,23:14,24:15,25:16,26:17,27:18,28:19,29:20,30:21,31:22,32:23,33:24,34:25,35:26,36:27,37:28,38:29,39:30,40:31,41:32,42:33,43:34,44:35,45:36,46:37,47:38,49:40,50:41,51:42,52:43,53:44,54:45,55:46,56:47,57:48,58:49,59:50,60:51,61:52,62:53,63:54,64:55,65:56,73:69,468:90,173:94,3:95,10:501,4:$V1,5:$V2,48:$V4,66:$V5,83:$V6,115:$V7,135:$V8,145:$V9,178:$Va,252:$Vb,307:$Vc,310:$Vd,311:$Ve,319:$Vf,365:$Vg,369:$Vh,370:$Vi,373:$Vj,375:$Vk,377:$Vl,378:$Vm,386:$Vn,387:$Vo,388:$Vp,405:$Vq,407:$Vr,408:$Vs,410:$Vt,411:$Vu,412:$Vv,413:$Vw,414:$Vx,418:$Vy,419:$Vz,422:$VA,423:$VB,469:$VC,471:$VD,472:$VE}),{365:[1,505],370:[1,502],371:[1,503],372:[1,504]},{3:506,4:$V1,5:$V2},o($Vf3,[2,778],{272:507,478:509,72:[1,508],153:[1,511],174:[1,510]}),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:240,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,140:512,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:513,4:$V1,5:$V2},{143:[1,514]},o($Vh3,$VF1,{322:515,145:$VG1}),{217:[1,516]},{3:517,4:$V1,5:$V2},o($VI,[2,684],{68:$Vi3}),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:519,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($Vc3,[2,687]),o($Vj3,[2,808],{389:173,447:520,133:521,129:[2,812],134:$Vs1,390:$Vi1,394:$Vj1}),{129:[1,522]},o($Vk3,$Vl3,{71:[1,523]}),o($Vm3,[2,822],{457:524,461:525,127:[1,526]}),{129:[2,813]},{3:527,4:$V1,5:$V2},o($Vk1,$VF1,{322:528,145:$VG1}),o($Vk1,$VF1,{322:529,145:$VG1}),o($VM1,[2,450]),o($VM1,[2,451]),{172:[1,530]},{172:[2,807]},o($Vn3,[2,802],{437:531,440:532,127:[1,533]}),o($VI1,[2,801]),{134:$VN,421:534},{4:$Vo3,70:[1,536],255:535,359:$Vp3},o($VI,[2,422],{119:[1,539]}),o($VI,[2,535]),{3:540,4:$V1,5:$V2},{277:[1,541]},o($Vh3,$VK1,{367:542,145:$VL1}),o($VI,[2,549]),{3:223,4:$V1,5:$V2,188:544,368:543},{3:223,4:$V1,5:$V2,188:544,368:545},o($VH,[2,624],{409:546,287:[1,547]}),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:548,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:549,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:550,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:551,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:552,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:553,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:554,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:555,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:556,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:557,4:$V1,5:$V2,71:[1,559],121:$VP,145:$VJ,185:558,189:560},{3:561,4:$V1,5:$V2,71:[1,563],121:$VP,145:$VJ,185:562,189:564},o($Vq3,[2,406],{242:132,189:133,243:134,105:135,241:136,185:137,244:138,107:139,245:140,190:141,191:142,246:143,247:144,248:145,133:146,249:147,52:149,147:151,3:152,389:173,88:565,4:$V1,5:$V2,71:$VO,121:$VP,122:$VQ,127:$VR,131:$VS,134:$VT,141:$VU,143:$VV,145:$VJ,168:$VW,169:$VX,170:$VY,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,390:$Vi1,394:$Vj1}),o($Vq3,[2,407],{242:132,189:133,243:134,105:135,241:136,185:137,244:138,107:139,245:140,190:141,191:142,246:143,247:144,248:145,133:146,249:147,52:149,147:151,3:152,389:173,88:566,4:$V1,5:$V2,71:$VO,121:$VP,122:$VQ,127:$VR,131:$VS,134:$VT,141:$VU,143:$VV,145:$VJ,168:$VW,169:$VX,170:$VY,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,390:$Vi1,394:$Vj1}),o($Vq3,[2,408],{242:132,189:133,243:134,105:135,241:136,185:137,244:138,107:139,245:140,190:141,191:142,246:143,247:144,248:145,133:146,249:147,52:149,147:151,3:152,389:173,88:567,4:$V1,5:$V2,71:$VO,121:$VP,122:$VQ,127:$VR,131:$VS,134:$VT,141:$VU,143:$VV,145:$VJ,168:$VW,169:$VX,170:$VY,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,390:$Vi1,394:$Vj1}),o($Vq3,[2,409],{242:132,189:133,243:134,105:135,241:136,185:137,244:138,107:139,245:140,190:141,191:142,246:143,247:144,248:145,133:146,249:147,52:149,147:151,3:152,389:173,88:568,4:$V1,5:$V2,71:$VO,121:$VP,122:$VQ,127:$VR,131:$VS,134:$VT,141:$VU,143:$VV,145:$VJ,168:$VW,169:$VX,170:$VY,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,390:$Vi1,394:$Vj1}),o($Vq3,$Vr3,{242:132,189:133,243:134,105:135,241:136,185:137,244:138,107:139,245:140,190:141,191:142,246:143,247:144,248:145,133:146,249:147,52:149,147:151,3:152,389:173,88:569,4:$V1,5:$V2,71:$VO,121:$VP,122:$VQ,127:$VR,131:$VS,134:$VT,141:$VU,143:$VV,145:$VJ,168:$VW,169:$VX,170:$VY,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,390:$Vi1,394:$Vj1}),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:570,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:571,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($Vq3,[2,411],{242:132,189:133,243:134,105:135,241:136,185:137,244:138,107:139,245:140,190:141,191:142,246:143,247:144,248:145,133:146,249:147,52:149,147:151,3:152,389:173,88:572,4:$V1,5:$V2,71:$VO,121:$VP,122:$VQ,127:$VR,131:$VS,134:$VT,141:$VU,143:$VV,145:$VJ,168:$VW,169:$VX,170:$VY,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,390:$Vi1,394:$Vj1}),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:573,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:574,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{153:[1,576],155:[1,578],300:575,306:[1,577]},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:579,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:580,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:384,4:$V1,5:$V2,71:[1,581],105:584,134:$Vs3,145:$VJ,189:585,191:583,301:582},{93:[1,587]},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:588,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:589,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:590,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{4:$Vo3,255:591,359:$Vp3},{72:[1,592]},{72:[1,593]},{72:[1,594]},{72:[1,595],93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},{72:[2,774]},{72:[2,775]},{124:$VL,125:$VM},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:240,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,140:596,141:$VU,143:$VV,145:$VJ,147:151,153:[1,598],168:$VW,169:$VX,170:$VY,174:[1,597],185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:599,4:$V1,5:$V2,138:$Vt3,169:[1,601]},o([4,5,8,48,66,68,70,71,72,83,87,89,92,93,101,109,119,120,121,122,124,125,127,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,170,172,174,176,178,187,195,197,209,210,211,212,213,214,215,216,219,226,229,230,232,234,252,263,264,265,266,267,268,269,270,271,275,283,285,286,287,289,302,303,305,307,310,311,319,365,369,370,373,375,377,378,386,387,388,390,394,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474],[2,384],{299:330,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,304:$Vc2}),o($Vu3,[2,385],{299:330,113:$VP1,114:$VQ1,123:$VS1,126:$VT1,128:$VU1,169:$V$1}),o($Vu3,[2,386],{299:330,113:$VP1,114:$VQ1,123:$VS1,126:$VT1,128:$VU1,169:$V$1}),o($Vr1,[2,387],{299:330}),o($Vf2,[2,340]),o($Vf2,[2,780]),o($Vf2,[2,781]),o($Vf2,[2,341]),o([4,5,8,48,66,68,70,71,72,83,87,89,92,93,101,106,109,113,114,115,119,120,121,122,123,124,125,126,127,128,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,168,169,170,172,174,176,178,187,195,197,209,210,211,212,213,214,215,216,217,218,219,226,229,230,232,234,252,263,264,265,266,267,268,269,270,271,275,283,285,286,287,288,289,290,291,292,293,294,295,296,297,298,302,303,304,305,307,310,311,319,365,369,370,373,375,377,378,386,387,388,390,394,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474],[2,338]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:602,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($Vj2,[2,578]),o($Vj2,[2,579]),o($Vj2,[2,580]),o($Vj2,[2,581]),o($Vj2,[2,583]),{37:603,73:69,83:$V6,173:94,178:$Va},{93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,281:604,284:366,285:$Vi2,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},{282:605,283:$Vv3,284:606,285:$Vi2,287:$Vw3},o($Vx3,[2,347]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:608,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:609,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{4:$Vo3,255:610,359:$Vp3},o($Vj2,[2,584]),{68:[1,612],398:[1,611]},o($Vj2,[2,600]),o($Vy3,[2,607]),o($Vz3,[2,585]),o($Vz3,[2,586]),o($Vz3,[2,587]),o($Vz3,[2,588]),o($Vz3,[2,589]),o($Vz3,[2,590]),o($Vz3,[2,591]),o($Vz3,[2,592]),o($Vz3,[2,593]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:613,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o([4,5,8,48,66,68,70,72,83,87,89,92,93,101,106,109,113,114,115,119,120,121,122,123,124,125,126,127,128,129,130,131,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,168,169,170,172,174,176,178,187,195,197,209,210,211,212,213,214,215,216,219,226,229,230,232,234,252,263,264,265,266,267,268,269,270,271,275,283,285,286,287,288,289,290,291,292,293,294,295,296,297,298,302,303,304,305,307,310,311,319,365,369,370,373,375,377,378,386,387,388,390,394,396,398,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474],$Ve2,{71:$VE1,132:$VA3}),o($VB3,[2,296],{71:$VE1}),o($Vr1,[2,297]),{68:[1,616],396:[1,615]},o($Vj2,[2,597]),o($VC3,[2,602]),{141:[1,617]},{141:[1,618]},{141:[1,619]},{37:623,71:[1,622],73:69,83:$V6,138:[1,620],173:94,178:$Va,315:[1,621]},o($Vk1,$Vl1,{312:624,187:$Vm1}),{217:[1,626],426:625},{3:199,4:$V1,5:$V2,71:$Vn1,122:$Vo1,131:$VS,133:193,134:$VT,141:$VU,145:$VJ,170:$VY,188:194,189:196,190:195,191:197,198:627,201:198,279:$Vf1,389:173,390:$Vi1,394:$Vj1},{218:[2,651]},{72:[1,628]},o($Vo2,[2,760],{200:629,3:630,4:$V1,5:$V2}),o($Vn2,[2,759]),o($Vo2,[2,171]),{3:631,4:$V1,5:$V2},o($Vo2,[2,174]),{3:632,4:$V1,5:$V2},o($Vo2,[2,178]),{3:633,4:$V1,5:$V2},o($Vo2,[2,181]),{3:634,4:$V1,5:$V2},o($Vo2,[2,184]),{3:635,4:$V1,5:$V2},{3:636,4:$V1,5:$V2},{137:[1,637]},o($VD3,[2,160],{76:638,172:[1,639]}),{3:199,4:$V1,5:$V2,122:[1,644],131:$VS,134:[1,645],141:$VU,145:$VJ,170:$VY,188:640,189:641,190:642,191:643,279:$Vf1},{3:650,4:$V1,5:$V2,103:646,104:647,105:648,106:$VE3},o($Vu2,[2,725]),o($VF3,[2,716],{85:651,171:652,172:[1,653]}),o($Vq1,[2,715],{142:654,168:$VG3,169:$VH3,170:$VI3}),o([4,5,8,66,68,70,72,106,109,113,114,115,119,120,121,122,123,124,125,126,127,128,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,168,169,170,172,174,176,187,263,264,265,266,267,268,269,270,271,283,287,390,394,473,474],[2,81],{71:[1,658]}),{110:[1,659]},{3:660,4:$V1,5:$V2},o($VJ3,[2,85]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:661,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:662,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:419,4:$V1,5:$V2,66:$Vv2,70:$Vw2,71:$Vx2,106:$Vy2,108:664,109:$Vz2,113:$VA2,114:$VB2,115:$VC2,116:663,119:$VD2,120:$VE2,121:$VF2,122:$VG2,123:$VH2,124:$VI2,125:$VJ2,126:$VK2,127:$VL2,128:$VM2,129:$VN2,130:$VO2,131:$VP2,132:$VQ2,133:441,134:$VR2,135:$VS2,137:$VT2,138:$VU2,139:$VV2,141:$VW2,143:$VX2,145:$VY2,147:451,149:452,151:$VZ2,153:$V_2,155:$V$2,157:$V03,158:$V13,159:$V23,160:$V33,161:$V43,162:$V53,164:$V63,174:$V73,176:$V83,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,389:173,390:$Vi1,394:$Vj1},{71:[1,665]},{71:[1,666]},{71:[1,667]},o($VJ3,[2,93]),o($VJ3,[2,94]),o($VJ3,[2,95]),o($VJ3,[2,96]),o($VJ3,[2,97]),o($VJ3,[2,98]),{3:668,4:$V1,5:$V2},{3:669,4:$V1,5:$V2,123:[1,670]},o($VJ3,[2,102]),o($VJ3,[2,103]),o($VJ3,[2,104]),{132:[1,671]},o($VJ3,[2,106]),{3:672,4:$V1,5:$V2,71:$Vh2,107:358,121:$VP,122:$VQ,131:$VS,141:$VU,170:$VY,185:359,190:361,244:360,273:$Va1,274:$Vb1,275:$Vc1,279:$Vf1,389:362,394:$Vj1},{134:[1,673]},{71:[1,674]},{134:[1,675]},o($VJ3,[2,111]),{71:[1,676]},{3:677,4:$V1,5:$V2},{71:[1,678]},{71:[1,679]},{71:[1,680]},{71:[1,681]},{71:[1,682],153:[1,683]},{71:[1,684]},{71:[1,685]},{71:[1,686]},{71:[1,687]},{71:[1,688]},{71:[1,689]},{71:[1,690]},{71:[1,691]},{71:[1,692]},{71:[2,740]},{71:[2,741]},{3:223,4:$V1,5:$V2,188:693},{3:223,4:$V1,5:$V2,188:694},{107:695,122:$VQ,275:$Vc1},o($VI,[2,552],{106:[1,696]}),{3:223,4:$V1,5:$V2,188:697},{107:698,122:$VQ,275:$Vc1},{3:699,4:$V1,5:$V2},o($VI,[2,648]),o($VI,[2,61]),{3:215,4:$V1,5:$V2,69:700},{71:[1,701]},o($VI,[2,629]),o($VI,[2,542]),{3:650,4:$V1,5:$V2,105:704,131:$VK3,134:$VL3,136:702,308:703,309:705},{133:708,134:$Vs1,389:173,390:$Vi1,394:$Vj1},o($VI,[2,626]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:709,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($Vq3,$Vr3,{242:132,189:133,243:134,105:135,241:136,185:137,244:138,107:139,245:140,190:141,191:142,246:143,247:144,248:145,133:146,249:147,52:149,147:151,3:152,389:173,88:710,4:$V1,5:$V2,71:$VO,121:$VP,122:$VQ,127:$VR,131:$VS,134:$VT,141:$VU,143:$VV,145:$VJ,168:$VW,169:$VX,170:$VY,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,390:$Vi1,394:$Vj1}),{107:711,122:$VQ,275:$Vc1},{3:246,4:$V1,5:$V2,417:712,418:$Vu1},o($VI,[2,608]),o($VI,[2,618]),o($VI,[2,619]),{113:[1,715],115:[1,713],402:714},o($VI,[2,700],{68:$Ve3}),{3:95,4:$V1,5:$V2,468:716},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:497,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,163:717,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,240:496,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:497,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,163:718,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,240:496,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:497,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,163:719,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,240:496,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($Vg3,[2,139]),o($Vg3,[2,755],{68:$VM3}),o($VN3,[2,259]),o($VN3,[2,266],{299:330,3:722,107:724,4:$V1,5:$V2,70:[1,721],93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,121:[1,723],122:$VQ,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,275:$Vc1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),o($Vx1,[2,756],{186:725,475:[1,726]}),{121:$VP,185:727},{68:$Ve3,72:[1,728]},o($VH,[2,8]),{137:[1,729],179:[1,730]},{179:[1,731]},{179:[1,732]},{179:[1,733]},o($VI,[2,531],{70:[1,735],71:[1,734]}),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:240,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,140:736,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($Vf2,[2,328]),o($Vf3,[2,779]),o($Vf3,[2,776]),o($Vf3,[2,777]),{68:$Vb3,72:[1,737]},o($VI,[2,536]),{277:[1,738]},{3:739,4:$V1,5:$V2,107:740,122:$VQ,275:$Vc1},{3:223,4:$V1,5:$V2,188:741},{217:[1,742]},o([8,68,70,72,122,127,129,141,283,287,390,394,473,474],$VH1,{446:284,449:285,3:286,456:287,453:288,401:289,445:743,4:$V1,5:$V2,131:$Vv1,134:$Vw1}),o($VI,[2,685],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),o($Vc3,[2,810],{448:744,454:745,70:$VO3}),o($Vj3,[2,809]),o([70,122,127,129,134,141,390,394],$VH1,{456:287,446:747,3:748,4:$V1,5:$V2}),o([68,70,72,122,127,129,141,390,394],$VH1,{445:283,446:284,449:285,3:286,456:287,453:288,401:289,444:749,4:$V1,5:$V2,131:$Vv1,134:$Vw1}),o($VP3,[2,824],{458:750,122:[1,751]}),o($Vm3,[2,823]),{3:752,4:$V1,5:$V2,121:[1,753]},o($VQ3,[2,691]),{3:223,4:$V1,5:$V2,188:754},{3:223,4:$V1,5:$V2,188:755},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:756,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($VR3,[2,804],{438:757,107:758,122:$VQ,275:$Vc1}),o($Vn3,[2,803]),{3:759,4:$V1,5:$V2},o($VJ1,[2,643]),o($VJ1,[2,644],{115:[1,760]}),{4:$Vo3,255:761,359:$Vp3},o([5,8,48,66,68,70,72,83,87,89,92,93,101,106,109,113,114,115,119,120,121,122,123,124,125,126,127,128,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,168,169,170,172,174,176,178,187,195,197,209,210,211,212,213,214,215,216,219,226,229,230,232,234,252,263,264,265,266,267,268,269,270,271,275,276,283,285,286,287,288,289,290,291,292,293,294,295,296,297,298,302,303,304,305,307,310,311,315,319,328,340,341,345,346,365,369,370,373,375,377,378,386,387,388,390,394,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474],[2,499],{4:[1,763],71:[1,762]}),{71:[1,764]},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:765,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($VI,[2,544]),o($Vh3,[2,524]),{3:766,4:$V1,5:$V2,107:767,122:$VQ,275:$Vc1},o($VI,[2,520],{68:$VS3}),o($VJ1,[2,522]),o($VI,[2,569],{68:$VS3}),o($VI,[2,623]),o($VI,$V0,{15:5,16:7,17:8,18:9,19:10,20:11,21:12,22:13,23:14,24:15,25:16,26:17,27:18,28:19,29:20,30:21,31:22,32:23,33:24,34:25,35:26,36:27,37:28,38:29,39:30,40:31,41:32,42:33,43:34,44:35,45:36,46:37,47:38,49:40,50:41,51:42,52:43,53:44,54:45,55:46,56:47,57:48,58:49,59:50,60:51,61:52,62:53,63:54,64:55,65:56,73:69,468:90,173:94,3:95,10:769,4:$V1,5:$V2,48:$V4,66:$V5,83:$V6,115:$V7,135:$V8,145:$V9,178:$Va,252:$Vb,307:$Vc,310:$Vd,311:$Ve,319:$Vf,365:$Vg,369:$Vh,370:$Vi,373:$Vj,375:$Vk,377:$Vl,378:$Vm,386:$Vn,387:$Vo,388:$Vp,405:$Vq,407:$Vr,408:$Vs,410:$Vt,411:$Vu,412:$Vv,413:$Vw,414:$Vx,418:$Vy,419:$Vz,422:$VA,423:$VB,469:$VC,471:$VD,472:$VE}),o($VT3,[2,351],{299:330,113:$VP1,114:$VQ1,123:$VS1,126:$VT1,128:$VU1,168:$V_1,169:$V$1,291:$V22}),o($VU3,[2,352],{299:330,113:$VP1,114:$VQ1,123:$VS1,126:$VT1,128:$VU1,168:$V_1,169:$V$1,289:[1,770],291:$V22}),o($VU3,[2,354],{299:330,113:$VP1,114:$VQ1,123:$VS1,126:$VT1,128:$VU1,168:$V_1,169:$V$1,289:[1,771],291:$V22}),o($Vu3,[2,356],{299:330,113:$VP1,114:$VQ1,123:$VS1,126:$VT1,128:$VU1,169:$V$1}),o($Vu3,[2,357],{299:330,113:$VP1,114:$VQ1,123:$VS1,126:$VT1,128:$VU1,169:$V$1}),o($VV3,[2,358],{299:330,113:$VP1,114:$VQ1,126:$VT1}),o($VV3,[2,359],{299:330,113:$VP1,114:$VQ1,126:$VT1}),o($VV3,[2,360],{299:330,113:$VP1,114:$VQ1,126:$VT1}),o([4,5,8,48,66,68,70,71,72,83,87,89,92,93,101,106,109,114,115,119,120,121,122,123,124,125,127,128,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,168,169,170,172,174,176,178,187,195,197,209,210,211,212,213,214,215,216,219,226,229,230,232,234,252,263,264,265,266,267,268,269,270,271,275,283,285,286,287,288,289,290,291,292,293,294,295,296,297,298,302,303,304,305,307,310,311,319,365,369,370,373,375,377,378,386,387,388,390,394,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474],[2,361],{299:330,113:$VP1,126:$VT1}),o($VB3,[2,362],{71:$VE1}),o($Vr1,[2,363]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:772,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($Vr1,[2,365]),o($VB3,[2,366],{71:$VE1}),o($Vr1,[2,367]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:773,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($Vr1,[2,369]),o($VW3,[2,370],{299:330,106:$VO1,113:$VP1,114:$VQ1,123:$VS1,126:$VT1,128:$VU1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,304:$Vc2}),o($VW3,[2,371],{299:330,106:$VO1,113:$VP1,114:$VQ1,123:$VS1,126:$VT1,128:$VU1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,304:$Vc2}),o($VW3,[2,372],{299:330,106:$VO1,113:$VP1,114:$VQ1,123:$VS1,126:$VT1,128:$VU1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,304:$Vc2}),o($VW3,[2,373],{299:330,106:$VO1,113:$VP1,114:$VQ1,123:$VS1,126:$VT1,128:$VU1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,304:$Vc2}),o([4,5,8,48,66,83,93,115,129,130,135,143,145,159,160,178,252,283,287,292,293,294,295,296,297,298,302,303,305,307,310,311,319,365,369,370,373,375,377,378,386,387,388,405,407,408,410,411,412,413,414,418,419,422,423,469,471,472,473,474],$VX3,{299:330,106:$VO1,113:$VP1,114:$VQ1,123:$VS1,126:$VT1,128:$VU1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,304:$Vc2}),o($VW3,[2,375],{299:330,106:$VO1,113:$VP1,114:$VQ1,123:$VS1,126:$VT1,128:$VU1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,304:$Vc2}),o($VW3,[2,376],{299:330,106:$VO1,113:$VP1,114:$VQ1,123:$VS1,126:$VT1,128:$VU1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,304:$Vc2}),o($VW3,[2,377],{299:330,106:$VO1,113:$VP1,114:$VQ1,123:$VS1,126:$VT1,128:$VU1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,304:$Vc2}),o($VW3,[2,378],{299:330,106:$VO1,113:$VP1,114:$VQ1,123:$VS1,126:$VT1,128:$VU1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,304:$Vc2}),o($VW3,[2,379],{299:330,106:$VO1,113:$VP1,114:$VQ1,123:$VS1,126:$VT1,128:$VU1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,304:$Vc2}),{71:[1,774]},{71:[2,412]},{71:[2,413]},{71:[2,414]},o($VY3,[2,382],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,304:$Vc2}),o([4,5,8,48,66,68,70,71,72,83,87,89,92,101,109,119,120,121,122,124,125,127,131,132,134,135,137,138,139,141,145,151,153,155,157,158,160,161,162,164,170,172,174,176,178,187,195,197,209,210,211,212,213,214,215,216,219,226,229,230,232,234,252,263,264,265,266,267,268,269,270,271,275,283,285,286,287,289,305,307,310,311,319,365,369,370,373,375,377,378,386,387,388,390,394,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474],[2,383],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2}),{3:152,4:$V1,5:$V2,37:775,52:149,71:$VO,72:[1,777],73:69,83:$V6,88:240,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,140:776,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,173:94,178:$Va,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($Vr1,[2,395]),o($Vr1,[2,397]),o($Vr1,[2,403]),o($Vr1,[2,404]),{3:356,4:$V1,5:$V2,71:[1,778]},{3:384,4:$V1,5:$V2,71:[1,779],105:584,134:$Vs3,145:$VJ,189:585,191:781,301:780},o($VY3,[2,399],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,304:$Vc2}),o($VY3,[2,400],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,304:$Vc2}),o([4,5,8,48,66,68,70,71,72,83,87,89,92,93,101,109,115,119,120,121,122,124,125,127,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,170,172,174,176,178,187,195,197,209,210,211,212,213,214,215,216,219,226,229,230,232,234,252,263,264,265,266,267,268,269,270,271,275,283,285,286,287,289,292,293,294,295,296,297,298,302,303,304,305,307,310,311,319,365,369,370,373,375,377,378,386,387,388,390,394,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474],[2,401],{299:330,106:$VO1,113:$VP1,114:$VQ1,123:$VS1,126:$VT1,128:$VU1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22}),o($Vr1,[2,402]),o($Vr1,[2,290]),o($Vr1,[2,291]),o($Vr1,[2,292]),o($Vr1,[2,388]),{68:$Vb3,72:[1,782]},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:783,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:784,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($Vr1,$VZ3),o($V_3,[2,272]),o($Vr1,[2,268]),{72:[1,786],93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},{72:[1,787]},{282:788,283:$Vv3,284:606,285:$Vi2,287:$Vw3},{283:[1,789]},o($Vx3,[2,346]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:790,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,286:[1,791],288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},{70:[1,792],93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},{68:[1,793]},o($Vj2,[2,598]),{3:384,4:$V1,5:$V2,71:$Vk2,105:379,107:377,121:$VP,122:$VQ,131:$VS,133:374,134:$Vs1,141:$VU,145:$VJ,170:$VY,185:376,189:382,190:381,244:378,245:380,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,279:$Vf1,389:173,390:$Vi1,392:795,393:375,394:$Vj1,398:[1,794]},{72:[1,796],93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},{3:797,4:$V1,5:$V2,138:$Vt3},o($Vj2,[2,595]),{3:392,4:$V1,5:$V2,121:$Vl2,122:$Vm2,396:[1,798],399:799},{3:384,4:$V1,5:$V2,71:$Vk2,105:379,107:377,121:$VP,122:$VQ,131:$VS,133:374,134:$Vs1,141:$VU,145:$VJ,170:$VY,185:376,189:382,190:381,244:378,245:380,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,279:$Vf1,389:173,390:$Vi1,392:800,393:375,394:$Vj1},{3:384,4:$V1,5:$V2,71:$Vk2,105:379,107:377,121:$VP,122:$VQ,131:$VS,133:374,134:$Vs1,141:$VU,145:$VJ,170:$VY,185:376,189:382,190:381,244:378,245:380,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,279:$Vf1,389:173,390:$Vi1,392:801,393:375,394:$Vj1},{3:384,4:$V1,5:$V2,71:$Vk2,105:379,107:377,121:$VP,122:$VQ,131:$VS,133:374,134:$Vs1,141:$VU,145:$VJ,170:$VY,185:376,189:382,190:381,244:378,245:380,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,279:$Vf1,389:173,390:$Vi1,392:802,393:375,394:$Vj1},{71:$V$3,131:$VS,133:805,134:$Vs1,141:$VU,170:$VY,190:806,279:$Vf1,313:803,389:173,390:$Vi1,394:$Vj1},{138:[1,807]},{3:650,4:$V1,5:$V2,94:808,105:809},o($V04,[2,427]),{3:223,4:$V1,5:$V2,188:810},{285:$V14,427:811,429:812,430:813},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:815,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{217:[2,652]},o($Vo2,[2,169],{3:816,4:$V1,5:$V2,70:[1,817]}),o($Vo2,[2,170]),o($Vo2,[2,761]),o($Vo2,[2,172]),o($Vo2,[2,175]),o($Vo2,[2,179]),o($Vo2,[2,182]),o($Vo2,[2,185]),o([4,5,8,66,68,70,71,72,83,87,92,109,119,135,137,138,143,151,157,158,172,176,178,195,197,209,210,211,212,213,214,215,216,217,218,219,232,234,276,283,287,315,328,340,341,345,346,365,370,371,372,473,474],[2,187]),{3:818,4:$V1,5:$V2},o($V24,[2,712],{77:819,86:820,87:[1,821],92:[1,822]}),{3:199,4:$V1,5:$V2,71:[1,824],122:$Vo1,131:$VS,133:193,134:$VT,141:$VU,145:$VJ,170:$VY,188:194,189:196,190:195,191:197,192:823,198:825,201:198,279:$Vf1,389:173,390:$Vi1,394:$Vj1},o($Vr2,[2,152]),o($Vr2,[2,153]),o($Vr2,[2,154]),o($Vr2,[2,155]),o($Vr2,[2,156]),{3:356,4:$V1,5:$V2},o($Vp1,[2,76],{68:[1,826]}),o($V34,[2,78]),o($V34,[2,79]),{107:827,122:$VQ,275:$Vc1},o([8,66,68,72,87,92,109,115,119,151,157,158,172,187,195,197,209,210,211,212,213,214,215,216,219,232,234,283,287,473,474],$Ve2,{132:$VA3}),o($VF3,[2,66]),o($VF3,[2,717]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:828,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($VJ3,[2,114]),o($VJ3,[2,132]),o($VJ3,[2,133]),o($VJ3,[2,134]),{3:152,4:$V1,5:$V2,52:149,71:$VO,72:[2,732],88:240,105:135,107:139,118:829,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,140:830,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{71:[1,831]},o($VJ3,[2,84]),o([4,5,8,66,68,70,71,72,109,115,119,120,121,122,124,125,127,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,170,172,174,176,187,263,264,265,266,267,268,269,270,271,283,287,390,394,473,474],[2,86],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,123:$VS1,126:$VT1,128:$VU1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),o([4,5,8,66,68,70,71,72,106,109,115,119,120,121,122,124,125,127,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,170,172,174,176,187,263,264,265,266,267,268,269,270,271,283,287,390,394,473,474],[2,87],{299:330,93:$VN1,113:$VP1,114:$VQ1,123:$VS1,126:$VT1,128:$VU1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),{3:419,4:$V1,5:$V2,66:$Vv2,70:$Vw2,71:$Vx2,72:[1,832],106:$Vy2,108:833,109:$Vz2,113:$VA2,114:$VB2,115:$VC2,119:$VD2,120:$VE2,121:$VF2,122:$VG2,123:$VH2,124:$VI2,125:$VJ2,126:$VK2,127:$VL2,128:$VM2,129:$VN2,130:$VO2,131:$VP2,132:$VQ2,133:441,134:$VR2,135:$VS2,137:$VT2,138:$VU2,139:$VV2,141:$VW2,143:$VX2,145:$VY2,147:451,149:452,151:$VZ2,153:$V_2,155:$V$2,157:$V03,158:$V13,159:$V23,160:$V33,161:$V43,162:$V53,164:$V63,174:$V73,176:$V83,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,389:173,390:$Vi1,394:$Vj1},o($V44,[2,728],{142:654,168:$VG3,169:$VH3,170:$VI3}),{3:419,4:$V1,5:$V2,66:$Vv2,70:$Vw2,71:$Vx2,106:$Vy2,108:835,109:$Vz2,113:$VA2,114:$VB2,115:$VC2,117:834,119:$VD2,120:$VE2,121:$VF2,122:$VG2,123:$VH2,124:$VI2,125:$VJ2,126:$VK2,127:$VL2,128:$VM2,129:$VN2,130:$VO2,131:$VP2,132:$VQ2,133:441,134:$VR2,135:$VS2,137:$VT2,138:$VU2,139:$VV2,141:$VW2,143:$VX2,145:$VY2,147:451,149:452,151:$VZ2,153:$V_2,155:$V$2,157:$V03,158:$V13,159:$V23,160:$V33,161:$V43,162:$V53,164:$V63,174:$V73,176:$V83,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:836,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:837,4:$V1,5:$V2},o($VJ3,[2,99]),o($VJ3,[2,100]),o($VJ3,[2,101]),o($VJ3,[2,105]),o($VJ3,[2,107]),{3:838,4:$V1,5:$V2},{3:650,4:$V1,5:$V2,105:704,131:$VK3,134:$VL3,136:839,308:703,309:705},{3:840,4:$V1,5:$V2},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:240,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,140:841,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($VJ3,[2,113]),o($V44,[2,734],{144:842}),o($V44,[2,736],{146:843}),o($V44,[2,738],{148:844}),o($V44,[2,742],{150:845}),o($V54,$V64,{152:846,167:847}),{71:[1,848]},o($V44,[2,744],{154:849}),o($V44,[2,746],{156:850}),o($V54,$V64,{167:847,152:851}),o($V54,$V64,{167:847,152:852}),o($V54,$V64,{167:847,152:853}),o($V54,$V64,{167:847,152:854}),{3:419,4:$V1,5:$V2,66:$Vv2,70:$Vw2,71:$Vx2,106:$Vy2,108:855,109:$Vz2,113:$VA2,114:$VB2,115:$VC2,119:$VD2,120:$VE2,121:$VF2,122:$VG2,123:$VH2,124:$VI2,125:$VJ2,126:$VK2,127:$VL2,128:$VM2,129:$VN2,130:$VO2,131:$VP2,132:$VQ2,133:441,134:$VR2,135:$VS2,137:$VT2,138:$VU2,139:$VV2,141:$VW2,143:$VX2,145:$VY2,147:451,149:452,151:$VZ2,153:$V_2,155:$V$2,157:$V03,158:$V13,159:$V23,160:$V33,161:$V43,162:$V53,164:$V63,174:$V73,176:$V83,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:497,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,163:856,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,240:496,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($V74,[2,748],{165:857}),o($VI,[2,562],{172:[1,858]}),o($VI,[2,558],{172:[1,859]}),o($VI,[2,551]),{107:860,122:$VQ,275:$Vc1},o($VI,[2,560],{172:[1,861]}),o($VI,[2,555]),o($VI,[2,556],{106:[1,862]}),o($V93,[2,62]),{37:863,73:69,83:$V6,173:94,178:$Va},o($VI,[2,416],{68:$V84,119:[1,864]}),o($V94,[2,417]),{115:[1,866]},{3:867,4:$V1,5:$V2},o($Vk1,[2,782]),o($Vk1,[2,783]),o($VI,[2,576]),o($Vc3,[2,331],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),o($VW3,$VX3,{299:330,106:$VO1,113:$VP1,114:$VQ1,123:$VS1,126:$VT1,128:$VU1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,304:$Vc2}),o($VJ1,[2,637]),o($VJ1,[2,639]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:868,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{113:[1,870],115:[1,869]},{3:872,4:$V1,5:$V2,71:$Va4,121:$Vb4,403:871},o($Vc3,[2,702]),o($Vg3,[2,136],{68:$VM3}),o($Vg3,[2,137],{68:$VM3}),o($Vg3,[2,138],{68:$VM3}),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:497,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,240:875,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:876,4:$V1,5:$V2,107:878,121:[1,877],122:$VQ,275:$Vc1},o($VN3,[2,261]),o($VN3,[2,263]),o($VN3,[2,265]),o($Vx1,[2,148]),o($Vx1,[2,757]),{72:[1,879]},o($VA1,[2,705]),{3:880,4:$V1,5:$V2},{3:881,4:$V1,5:$V2},{3:883,4:$V1,5:$V2,355:882},{3:883,4:$V1,5:$V2,355:884},{3:885,4:$V1,5:$V2},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:240,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,140:886,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:887,4:$V1,5:$V2},{68:$Vb3,72:[1,888]},o($Vf2,[2,329]),o($Vh3,[2,462]),o($VI,$Vc4,{376:889,70:$Vd4,71:[1,890]}),o($VI,$Vc4,{376:892,70:$Vd4}),{71:[1,893]},{3:223,4:$V1,5:$V2,188:894},o($Vc3,[2,686]),o($Vc3,[2,688]),o($Vc3,[2,811]),{131:$Vv1,134:$Vw1,401:895},o($Ve4,[2,814],{389:173,450:896,133:897,134:$Vs1,390:$Vi1,394:$Vj1}),o($Vk3,$Vl3),{68:$Vi3,72:[1,898]},o($Vf4,[2,826],{459:899,460:900,141:[1,901]}),o($VP3,[2,825]),o($Vm3,[2,696]),o($Vm3,[2,697]),o($VI,[2,449],{71:[1,902]}),{70:[1,904],71:[1,903]},{93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,137:[1,905],143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},o($V04,$Vg4,{73:69,173:94,439:906,37:909,83:$V6,135:$Vh4,178:$Va,441:$Vi4}),o($VR3,[2,805]),o($Vn3,[2,678]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:910,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($VJ1,[2,645],{115:[1,911]}),{121:$Vj4,266:$Vk4,358:912},o([4,5,8,48,66,68,70,72,83,87,89,92,93,101,106,109,113,114,115,119,120,121,122,123,124,125,126,127,128,129,130,131,132,134,135,137,138,139,141,143,145,151,153,155,157,158,159,160,161,162,164,168,169,170,172,174,176,178,187,195,197,209,210,211,212,213,214,215,216,219,226,229,230,232,234,252,263,264,265,266,267,268,269,270,271,275,276,283,285,286,287,288,289,290,291,292,293,294,295,296,297,298,302,303,304,305,307,310,311,315,319,328,340,341,345,346,365,369,370,373,375,377,378,386,387,388,390,394,405,407,408,410,411,412,413,414,418,419,422,423,435,441,469,471,472,473,474],[2,500],{71:[1,915]}),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:917,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,316:916,389:173,390:$Vi1,394:$Vj1},o($VI,[2,421],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),o($VI,[2,545]),o($VI,[2,546]),{3:223,4:$V1,5:$V2,188:918},o($VI,[2,625]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:919,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:920,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{72:[1,921],93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},{72:[1,922],93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},{3:152,4:$V1,5:$V2,37:923,52:149,71:$VO,73:69,83:$V6,88:240,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,140:924,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,173:94,178:$Va,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{72:[1,925]},{68:$Vb3,72:[1,926]},o($Vr1,[2,393]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:927,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,37:928,52:149,71:$VO,72:[1,930],73:69,83:$V6,88:240,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,140:929,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,173:94,178:$Va,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($Vr1,[2,396]),o($Vr1,[2,398]),o($Vr1,$Vl4,{258:931,259:$Vm4}),{72:[1,933],93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},{72:[1,934],93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},{3:935,4:$V1,5:$V2,169:[1,936]},o($Vj2,[2,577]),o($Vr1,[2,339]),{283:[1,937]},o($Vr1,[2,345]),{93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,283:[2,349],288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:938,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{4:$Vo3,255:939,359:$Vp3},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:940,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($Vj2,[2,599]),o($Vy3,[2,606]),o($Vz3,[2,594]),o($V_3,$VZ3),o($Vj2,[2,596]),o($VC3,[2,601]),o($VC3,[2,603]),o($VC3,[2,604]),o($VC3,[2,605]),o($V04,[2,423],{68:$Vn4}),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:917,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,316:943,389:173,390:$Vi1,394:$Vj1},o($Vo4,[2,433]),o($Vo4,[2,434]),o($V04,[2,425]),{68:$Vp4,72:[1,944]},o($Vq4,[2,446]),{37:947,73:69,83:$V6,138:[1,946],173:94,178:$Va},o($VI,[2,672],{428:948,429:949,430:950,285:$V14,435:[1,951]}),o($Vr4,[2,656]),o($Vr4,[2,657]),{143:[1,953],431:[1,952]},{93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,285:[2,653],288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},o($Vo2,[2,167]),{3:954,4:$V1,5:$V2},o($VI,[2,530]),o($Vs4,[2,224],{78:955,119:[1,956]}),o($V24,[2,713]),{71:[1,957]},{71:[1,958]},o($VD3,[2,157],{193:959,202:961,194:962,203:963,208:966,68:$Vt4,195:$Vu4,197:$Vv4,209:$Vw4,210:$Vx4,211:$Vy4,212:$Vz4,213:$VA4,214:$VB4,215:$VC4,216:$VD4}),{3:199,4:$V1,5:$V2,37:398,71:$Vn1,73:69,83:$V6,122:$Vo1,131:$VS,133:193,134:$VT,141:$VU,145:$VJ,170:$VY,173:94,178:$Va,188:194,189:196,190:195,191:197,192:975,198:825,201:198,279:$Vf1,389:173,390:$Vi1,394:$Vj1},o($Vq4,[2,165]),{3:650,4:$V1,5:$V2,104:976,105:648,106:$VE3},o($V34,[2,80]),o($VF3,[2,135],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),{72:[1,977]},{68:$Vb3,72:[2,733]},{3:152,4:$V1,5:$V2,52:149,71:$VO,72:[2,726],88:982,105:135,107:139,111:978,112:979,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,228:980,229:[1,981],241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($VJ3,[2,88]),o($V44,[2,729],{142:654,168:$VG3,169:$VH3,170:$VI3}),{3:419,4:$V1,5:$V2,66:$Vv2,70:$Vw2,71:$Vx2,72:[1,983],106:$Vy2,108:984,109:$Vz2,113:$VA2,114:$VB2,115:$VC2,119:$VD2,120:$VE2,121:$VF2,122:$VG2,123:$VH2,124:$VI2,125:$VJ2,126:$VK2,127:$VL2,128:$VM2,129:$VN2,130:$VO2,131:$VP2,132:$VQ2,133:441,134:$VR2,135:$VS2,137:$VT2,138:$VU2,139:$VV2,141:$VW2,143:$VX2,145:$VY2,147:451,149:452,151:$VZ2,153:$V_2,155:$V$2,157:$V03,158:$V13,159:$V23,160:$V33,161:$V43,162:$V53,164:$V63,174:$V73,176:$V83,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,389:173,390:$Vi1,394:$Vj1},o($V44,[2,730],{142:654,168:$VG3,169:$VH3,170:$VI3}),{72:[1,985],93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},{72:[1,986]},o($VJ3,[2,108]),{68:$V84,72:[1,987]},o($VJ3,[2,110]),{68:$Vb3,72:[1,988]},{3:419,4:$V1,5:$V2,66:$Vv2,70:$Vw2,71:$Vx2,72:[1,989],106:$Vy2,108:990,109:$Vz2,113:$VA2,114:$VB2,115:$VC2,119:$VD2,120:$VE2,121:$VF2,122:$VG2,123:$VH2,124:$VI2,125:$VJ2,126:$VK2,127:$VL2,128:$VM2,129:$VN2,130:$VO2,131:$VP2,132:$VQ2,133:441,134:$VR2,135:$VS2,137:$VT2,138:$VU2,139:$VV2,141:$VW2,143:$VX2,145:$VY2,147:451,149:452,151:$VZ2,153:$V_2,155:$V$2,157:$V03,158:$V13,159:$V23,160:$V33,161:$V43,162:$V53,164:$V63,174:$V73,176:$V83,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,389:173,390:$Vi1,394:$Vj1},{3:419,4:$V1,5:$V2,66:$Vv2,70:$Vw2,71:$Vx2,72:[1,991],106:$Vy2,108:992,109:$Vz2,113:$VA2,114:$VB2,115:$VC2,119:$VD2,120:$VE2,121:$VF2,122:$VG2,123:$VH2,124:$VI2,125:$VJ2,126:$VK2,127:$VL2,128:$VM2,129:$VN2,130:$VO2,131:$VP2,132:$VQ2,133:441,134:$VR2,135:$VS2,137:$VT2,138:$VU2,139:$VV2,141:$VW2,143:$VX2,145:$VY2,147:451,149:452,151:$VZ2,153:$V_2,155:$V$2,157:$V03,158:$V13,159:$V23,160:$V33,161:$V43,162:$V53,164:$V63,174:$V73,176:$V83,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,389:173,390:$Vi1,394:$Vj1},{3:419,4:$V1,5:$V2,66:$Vv2,70:$Vw2,71:$Vx2,72:[1,993],106:$Vy2,108:994,109:$Vz2,113:$VA2,114:$VB2,115:$VC2,119:$VD2,120:$VE2,121:$VF2,122:$VG2,123:$VH2,124:$VI2,125:$VJ2,126:$VK2,127:$VL2,128:$VM2,129:$VN2,130:$VO2,131:$VP2,132:$VQ2,133:441,134:$VR2,135:$VS2,137:$VT2,138:$VU2,139:$VV2,141:$VW2,143:$VX2,145:$VY2,147:451,149:452,151:$VZ2,153:$V_2,155:$V$2,157:$V03,158:$V13,159:$V23,160:$V33,161:$V43,162:$V53,164:$V63,174:$V73,176:$V83,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,389:173,390:$Vi1,394:$Vj1},{3:419,4:$V1,5:$V2,66:$Vv2,70:$Vw2,71:$Vx2,72:[1,995],106:$Vy2,108:996,109:$Vz2,113:$VA2,114:$VB2,115:$VC2,119:$VD2,120:$VE2,121:$VF2,122:$VG2,123:$VH2,124:$VI2,125:$VJ2,126:$VK2,127:$VL2,128:$VM2,129:$VN2,130:$VO2,131:$VP2,132:$VQ2,133:441,134:$VR2,135:$VS2,137:$VT2,138:$VU2,139:$VV2,141:$VW2,143:$VX2,145:$VY2,147:451,149:452,151:$VZ2,153:$V_2,155:$V$2,157:$V03,158:$V13,159:$V23,160:$V33,161:$V43,162:$V53,164:$V63,174:$V73,176:$V83,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,389:173,390:$Vi1,394:$Vj1},{68:$VE4,72:[1,997]},o($VF4,[2,131],{389:173,3:419,133:441,147:451,149:452,108:999,4:$V1,5:$V2,66:$Vv2,70:$Vw2,71:$Vx2,106:$Vy2,109:$Vz2,113:$VA2,114:$VB2,115:$VC2,119:$VD2,120:$VE2,121:$VF2,122:$VG2,123:$VH2,124:$VI2,125:$VJ2,126:$VK2,127:$VL2,128:$VM2,129:$VN2,130:$VO2,131:$VP2,132:$VQ2,134:$VR2,135:$VS2,137:$VT2,138:$VU2,139:$VV2,141:$VW2,143:$VX2,145:$VY2,151:$VZ2,153:$V_2,155:$V$2,157:$V03,158:$V13,159:$V23,160:$V33,161:$V43,162:$V53,164:$V63,174:$V73,176:$V83,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,390:$Vi1,394:$Vj1}),o($V54,$V64,{167:847,152:1000}),{3:419,4:$V1,5:$V2,66:$Vv2,70:$Vw2,71:$Vx2,72:[1,1001],106:$Vy2,108:1002,109:$Vz2,113:$VA2,114:$VB2,115:$VC2,119:$VD2,120:$VE2,121:$VF2,122:$VG2,123:$VH2,124:$VI2,125:$VJ2,126:$VK2,127:$VL2,128:$VM2,129:$VN2,130:$VO2,131:$VP2,132:$VQ2,133:441,134:$VR2,135:$VS2,137:$VT2,138:$VU2,139:$VV2,141:$VW2,143:$VX2,145:$VY2,147:451,149:452,151:$VZ2,153:$V_2,155:$V$2,157:$V03,158:$V13,159:$V23,160:$V33,161:$V43,162:$V53,164:$V63,174:$V73,176:$V83,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,389:173,390:$Vi1,394:$Vj1},{3:419,4:$V1,5:$V2,66:$Vv2,70:$Vw2,71:$Vx2,72:[1,1003],106:$Vy2,108:1004,109:$Vz2,113:$VA2,114:$VB2,115:$VC2,119:$VD2,120:$VE2,121:$VF2,122:$VG2,123:$VH2,124:$VI2,125:$VJ2,126:$VK2,127:$VL2,128:$VM2,129:$VN2,130:$VO2,131:$VP2,132:$VQ2,133:441,134:$VR2,135:$VS2,137:$VT2,138:$VU2,139:$VV2,141:$VW2,143:$VX2,145:$VY2,147:451,149:452,151:$VZ2,153:$V_2,155:$V$2,157:$V03,158:$V13,159:$V23,160:$V33,161:$V43,162:$V53,164:$V63,174:$V73,176:$V83,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,389:173,390:$Vi1,394:$Vj1},{68:$VE4,72:[1,1005]},{68:$VE4,72:[1,1006]},{68:$VE4,72:[1,1007]},{68:$VE4,72:[1,1008]},{72:[1,1009],142:654,168:$VG3,169:$VH3,170:$VI3},{68:$VM3,72:[1,1010]},{3:419,4:$V1,5:$V2,66:$Vv2,68:[1,1011],70:$Vw2,71:$Vx2,106:$Vy2,108:1012,109:$Vz2,113:$VA2,114:$VB2,115:$VC2,119:$VD2,120:$VE2,121:$VF2,122:$VG2,123:$VH2,124:$VI2,125:$VJ2,126:$VK2,127:$VL2,128:$VM2,129:$VN2,130:$VO2,131:$VP2,132:$VQ2,133:441,134:$VR2,135:$VS2,137:$VT2,138:$VU2,139:$VV2,141:$VW2,143:$VX2,145:$VY2,147:451,149:452,151:$VZ2,153:$V_2,155:$V$2,157:$V03,158:$V13,159:$V23,160:$V33,161:$V43,162:$V53,164:$V63,174:$V73,176:$V83,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,389:173,390:$Vi1,394:$Vj1},{3:1013,4:$V1,5:$V2},{3:1014,4:$V1,5:$V2},o($VI,[2,553]),{3:1015,4:$V1,5:$V2},{107:1016,122:$VQ,275:$Vc1},{72:[1,1017]},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1018,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:650,4:$V1,5:$V2,105:704,131:$VK3,134:$VL3,308:1019,309:705},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1020,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{115:[1,1021]},o($VI,[2,609],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1022,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:872,4:$V1,5:$V2,71:$Va4,121:$Vb4,403:1023},o($VG4,[2,614]),o($VG4,[2,615]),o($VG4,[2,616]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1024,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($VN3,[2,258]),o($VN3,[2,260]),o($VN3,[2,262]),o($VN3,[2,264]),o($Vx1,[2,149]),o($VI,[2,525]),{137:[1,1025]},o($VI,[2,526]),o($Vc3,[2,494],{255:1026,4:$Vo3,357:[1,1027],359:$Vp3}),o($VI,[2,527]),o($VI,[2,529]),{68:$Vb3,72:[1,1028]},o($VI,[2,533]),o($Vf2,[2,327]),o($VI,[2,537]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:240,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,140:1029,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:1030,4:$V1,5:$V2},o($VI,[2,539]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:982,105:135,107:139,111:1031,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,228:980,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{71:[1,1032]},{3:1033,4:$V1,5:$V2},{70:$VO3,129:[2,816],451:1034,454:1035},o($Ve4,[2,815]),o($Vc3,[2,690]),o($Vf4,[2,694]),o($Vf4,[2,827]),{3:1036,4:$V1,5:$V2},{3:883,4:$V1,5:$V2,70:[1,1039],323:1037,330:1038,355:1040},{3:650,4:$V1,5:$V2,94:1041,105:809},{37:1042,73:69,83:$V6,173:94,178:$Va},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1043,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($V04,[2,677]),{3:650,4:$V1,5:$V2,105:704,131:$VK3,134:$VL3,136:1044,308:703,309:705},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:240,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,140:1045,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($V04,[2,682]),o($VJ1,[2,646],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1046,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{68:[1,1047],72:[1,1048]},o($VF4,[2,502]),o($VF4,[2,503]),{121:$Vj4,266:$Vk4,358:1049},{68:$VH4,72:[1,1050]},o($VF4,[2,438],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),o($VJ1,[2,521]),o($VT3,[2,353],{299:330,113:$VP1,114:$VQ1,123:$VS1,126:$VT1,128:$VU1,168:$V_1,169:$V$1,291:$V22}),o($VT3,[2,355],{299:330,113:$VP1,114:$VQ1,123:$VS1,126:$VT1,128:$VU1,168:$V_1,169:$V$1,291:$V22}),o($Vr1,[2,364]),o($Vr1,[2,368]),{72:[1,1052]},{68:$Vb3,72:[1,1053]},o($Vr1,[2,389]),o($Vr1,[2,391]),{72:[1,1054],93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},{72:[1,1055]},{68:$Vb3,72:[1,1056]},o($Vr1,[2,394]),o($Vr1,[2,309]),{71:[1,1057]},o($Vr1,$Vl4,{258:1058,259:$Vm4}),o($Vr1,$Vl4,{258:1059,259:$Vm4}),o($V_3,[2,270]),o($Vr1,[2,267]),o($Vr1,[2,344]),o($Vx3,[2,348],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),{68:[1,1061],72:[1,1060]},{68:[1,1063],72:[1,1062],93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},{3:935,4:$V1,5:$V2},{71:[1,1064],131:$VS,133:1065,134:$Vs1,141:$VU,170:$VY,190:1066,279:$Vf1,389:173,390:$Vi1,394:$Vj1},{68:$VH4,72:[1,1067]},{37:1069,73:69,83:$V6,138:[1,1068],173:94,178:$Va},{3:650,4:$V1,5:$V2,105:1070},{71:$V$3,131:$VS,133:805,134:$Vs1,141:$VU,170:$VY,190:806,279:$Vf1,313:1071,389:173,390:$Vi1,394:$Vj1},o($V04,[2,428]),o($VI,[2,649]),o($Vr4,[2,654]),o($Vr4,[2,655]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:497,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,163:1072,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,240:496,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{159:[1,1074],286:[1,1073]},{431:[1,1075]},o($Vo2,[2,168]),o($VI4,[2,226],{79:1076,219:[1,1077]}),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1078,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1079,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:1080,4:$V1,5:$V2},o($VD3,[2,158],{203:963,208:966,202:1081,194:1082,195:$Vu4,197:$Vv4,209:$Vw4,210:$Vx4,211:$Vy4,212:$Vz4,213:$VA4,214:$VB4,215:$VC4,216:$VD4}),{3:199,4:$V1,5:$V2,71:$Vn1,122:$Vo1,131:$VS,133:193,134:$VT,141:$VU,145:$VJ,170:$VY,188:194,189:196,190:195,191:197,198:1083,201:198,279:$Vf1,389:173,390:$Vi1,394:$Vj1},o($VJ4,[2,191]),o($VJ4,[2,192]),{3:199,4:$V1,5:$V2,71:[1,1088],131:$VS,133:1086,134:$VT,141:$VU,145:$VJ,170:$VY,188:1085,189:1089,190:1087,191:1090,204:1084,279:$Vf1,389:173,390:$Vi1,394:$Vj1},{196:[1,1091],210:$VK4},{196:[1,1093],210:$VL4},o($VM4,[2,208]),{195:[1,1097],197:[1,1096],208:1095,210:$Vx4,211:$Vy4,212:$Vz4,213:$VA4,214:$VB4,215:$VC4,216:$VD4},o($VM4,[2,210]),{210:[1,1098]},{197:[1,1100],210:[1,1099]},{197:[1,1102],210:[1,1101]},{197:[1,1103]},{210:[1,1104]},{210:[1,1105]},{68:$Vt4,193:1106,194:962,195:$Vu4,197:$Vv4,202:961,203:963,208:966,209:$Vw4,210:$Vx4,211:$Vy4,212:$Vz4,213:$VA4,214:$VB4,215:$VC4,216:$VD4},o($V34,[2,77]),o($VJ3,[2,90]),{68:$VN4,72:[1,1107]},{72:[1,1109]},o($VO4,[2,247]),{72:[2,727]},o($VO4,[2,249],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,229:[1,1110],230:[1,1111],288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),o($VJ3,[2,89]),o($V44,[2,731],{142:654,168:$VG3,169:$VH3,170:$VI3}),o($VJ3,[2,91]),o($VJ3,[2,92]),o($VJ3,[2,109]),o($VJ3,[2,112]),o($VJ3,[2,115]),o($V44,[2,735],{142:654,168:$VG3,169:$VH3,170:$VI3}),o($VJ3,[2,116]),o($V44,[2,737],{142:654,168:$VG3,169:$VH3,170:$VI3}),o($VJ3,[2,117]),o($V44,[2,739],{142:654,168:$VG3,169:$VH3,170:$VI3}),o($VJ3,[2,118]),o($V44,[2,743],{142:654,168:$VG3,169:$VH3,170:$VI3}),o($VJ3,[2,119]),o($V54,[2,750],{166:1112}),o($V54,[2,753],{142:654,168:$VG3,169:$VH3,170:$VI3}),{68:$VE4,72:[1,1113]},o($VJ3,[2,121]),o($V44,[2,745],{142:654,168:$VG3,169:$VH3,170:$VI3}),o($VJ3,[2,122]),o($V44,[2,747],{142:654,168:$VG3,169:$VH3,170:$VI3}),o($VJ3,[2,123]),o($VJ3,[2,124]),o($VJ3,[2,125]),o($VJ3,[2,126]),o($VJ3,[2,127]),o($VJ3,[2,128]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:240,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,140:1114,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($V74,[2,749],{142:654,168:$VG3,169:$VH3,170:$VI3}),o($VI,[2,563]),o($VI,[2,559]),o($VI,[2,561]),o($VI,[2,557]),o($V93,[2,64]),o($VI,[2,415],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),o($V94,[2,418]),o($V94,[2,419],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1115,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($VI,[2,610],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),o($VG4,[2,613]),{72:[1,1116],93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},{3:1117,4:$V1,5:$V2},o($Vc3,[2,504],{356:1118,360:1119,361:1120,338:1128,143:$VP4,176:$VQ4,276:$VR4,315:$VS4,328:$VT4,340:$VU4,341:$VV4,345:$VW4,346:$VX4}),o($Vc3,[2,493]),o($VI,[2,532],{70:[1,1131]}),{68:$Vb3,72:[1,1132]},o($VI,[2,541]),{68:$VN4,72:[1,1133]},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:982,105:135,107:139,111:1134,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,228:980,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($VQ3,[2,692]),{129:[1,1135]},{129:[2,817]},o($Vf4,[2,695]),{72:[1,1136]},{68:[1,1137],72:[2,464]},{37:1138,73:69,83:$V6,173:94,178:$Va},o($VF4,[2,490]),{68:$Vp4,72:[1,1139]},o($VI,[2,798],{381:1140,382:1141,66:$VY4}),o($V04,$Vg4,{73:69,173:94,299:330,37:909,439:1143,83:$V6,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,135:$Vh4,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,178:$Va,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2,441:$Vi4}),o($V04,[2,680],{68:$V84}),o($V04,[2,681],{68:$Vb3}),o($VJ1,[2,647],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),{121:[1,1144]},o($VZ4,[2,497]),{68:[1,1145],72:[1,1146]},o($VZ4,[2,501]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1147,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($Vr1,[2,380]),o($Vr1,[2,381]),o($Vr1,[2,405]),o($Vr1,[2,390]),o($Vr1,[2,392]),{109:$V_4,260:1148,261:1149,262:[1,1150]},o($Vr1,[2,310]),o($Vr1,[2,311]),o($Vr1,[2,298]),{121:[1,1152]},o($Vr1,[2,300]),{121:[1,1153]},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:917,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,316:1154,389:173,390:$Vi1,394:$Vj1},o($Vo4,[2,436]),o($Vo4,[2,437]),o($Vo4,[2,432]),{71:$V$3,131:$VS,133:805,134:$Vs1,141:$VU,170:$VY,190:806,279:$Vf1,313:1155,389:173,390:$Vi1,394:$Vj1},o($V04,[2,429]),o($Vq4,[2,447]),o($V04,[2,424],{68:$Vn4}),o($VI,[2,673],{68:$VM3,187:[1,1156]}),{307:$V$4,310:$V05,432:1157},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1160,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{110:[1,1162],159:[1,1163],286:[1,1161]},o($V15,[2,245],{80:1164,109:[1,1165]}),{110:[1,1166]},o($Vs4,[2,225],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),{89:[1,1167],93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},{89:[1,1168]},o($VJ4,[2,189]),o($VJ4,[2,190]),o($Vq4,[2,166]),o($VJ4,[2,223],{205:1169,217:[1,1170],218:[1,1171]}),o($V25,[2,194],{3:1172,4:$V1,5:$V2,70:[1,1173]}),o($V35,[2,762],{206:1174,70:[1,1175]}),{3:1176,4:$V1,5:$V2,70:[1,1177]},{37:1178,73:69,83:$V6,173:94,178:$Va},o($V25,[2,202],{3:1179,4:$V1,5:$V2,70:[1,1180]}),o($V25,[2,205],{3:1181,4:$V1,5:$V2,70:[1,1182]}),{71:[1,1183]},o($VM4,[2,220]),{71:[1,1184]},o($VM4,[2,216]),o($VM4,[2,209]),{210:$VL4},{210:$VK4},o($VM4,[2,211]),o($VM4,[2,212]),{210:[1,1185]},o($VM4,[2,214]),{210:[1,1186]},{210:[1,1187]},o($VM4,[2,218]),o($VM4,[2,219]),{72:[1,1188],194:1082,195:$Vu4,197:$Vv4,202:1081,203:963,208:966,209:$Vw4,210:$Vx4,211:$Vy4,212:$Vz4,213:$VA4,214:$VB4,215:$VC4,216:$VD4},o($VJ3,[2,82]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:982,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,228:1189,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($VJ3,[2,83]),o($VO4,[2,250]),{231:[1,1190]},o($VF4,[2,130],{389:173,3:419,133:441,147:451,149:452,108:1191,4:$V1,5:$V2,66:$Vv2,70:$Vw2,71:$Vx2,106:$Vy2,109:$Vz2,113:$VA2,114:$VB2,115:$VC2,119:$VD2,120:$VE2,121:$VF2,122:$VG2,123:$VH2,124:$VI2,125:$VJ2,126:$VK2,127:$VL2,128:$VM2,129:$VN2,130:$VO2,131:$VP2,132:$VQ2,134:$VR2,135:$VS2,137:$VT2,138:$VU2,139:$VV2,141:$VW2,143:$VX2,145:$VY2,151:$VZ2,153:$V_2,155:$V$2,157:$V03,158:$V13,159:$V23,160:$V33,161:$V43,162:$V53,164:$V63,174:$V73,176:$V83,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,390:$Vi1,394:$Vj1}),o($VJ3,[2,120]),{68:$Vb3,72:[1,1192]},o($V94,[2,420],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),o($VG4,[2,617]),o($VI,[2,528]),o($Vc3,[2,492]),o($Vc3,[2,505],{338:1128,361:1193,143:$VP4,176:$VQ4,276:$VR4,315:$VS4,328:$VT4,340:$VU4,341:$VV4,345:$VW4,346:$VX4}),o($Va3,[2,507]),{342:[1,1194]},{342:[1,1195]},{3:223,4:$V1,5:$V2,188:1196},o($Va3,[2,513],{71:[1,1197]}),{3:108,4:$V1,5:$V2,71:[1,1199],107:231,121:$VP,122:$VQ,131:$VS,141:$VU,145:$VJ,170:$VY,185:230,189:235,190:234,244:232,245:233,251:$Vt1,257:1198,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,279:$Vf1},o($Va3,[2,516]),{276:[1,1200]},o($Va3,[2,518]),o($Va3,[2,519]),{71:[1,1201]},{3:1202,4:$V1,5:$V2},o($VI,$Vc4,{376:1203,70:$Vd4}),o($VI,[2,547]),{68:$VN4,72:[1,1204]},o([8,68,72,122,127,141,283,287,473,474],$VH1,{456:287,401:289,3:748,452:1205,446:1206,453:1207,4:$V1,5:$V2,131:$Vv1,134:$Vw1}),o($VI,[2,452],{324:1208,326:1209,327:1210,4:$V45,315:$V55,328:$V65}),o($V75,$V85,{3:883,331:1214,355:1215,332:1216,333:1217,4:$V1,5:$V2,339:$V95}),{72:[2,465]},{70:[1,1219]},o($VI,[2,565]),o($VI,[2,799]),{340:[1,1221],383:[1,1220]},o($V04,[2,683]),{72:[1,1222]},{121:[1,1223]},o($VZ4,[2,498]),o($VF4,[2,439],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),{72:[1,1224],109:$V_4,261:1225},{72:[1,1226]},{110:[1,1227]},{110:[1,1228]},{72:[1,1229]},{72:[1,1230]},{68:$VH4,72:[1,1231]},o($V04,[2,426],{68:$Vn4}),{3:223,4:$V1,5:$V2,131:$Vv1,134:$Vw1,188:1233,401:1232},o($Vr4,[2,658]),o($Vr4,[2,660]),{135:[1,1234]},{93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,286:[1,1235],288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},{311:$Va5,433:1236},{387:[1,1239],434:[1,1238]},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1240,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($Vb5,[2,253],{81:1241,232:[1,1242],234:[1,1243]}),{110:[1,1244]},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1250,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,220:1245,222:1246,223:$Vc5,224:$Vd5,225:$Ve5,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:1251,4:$V1,5:$V2},{3:1252,4:$V1,5:$V2},o($VJ4,[2,193]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1253,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:650,4:$V1,5:$V2,94:1254,105:809},o($V25,[2,195]),{3:1255,4:$V1,5:$V2},o($V25,[2,764],{207:1256,3:1257,4:$V1,5:$V2}),o($V35,[2,763]),o($V25,[2,198]),{3:1258,4:$V1,5:$V2},{72:[1,1259]},o($V25,[2,203]),{3:1260,4:$V1,5:$V2},o($V25,[2,206]),{3:1261,4:$V1,5:$V2},{37:1262,73:69,83:$V6,173:94,178:$Va},{37:1263,73:69,83:$V6,173:94,178:$Va},o($VM4,[2,213]),o($VM4,[2,215]),o($VM4,[2,217]),o($VD3,[2,159]),o($VO4,[2,248]),o($VO4,[2,251],{229:[1,1264]}),o($V54,[2,751],{142:654,168:$VG3,169:$VH3,170:$VI3}),o($VJ3,[2,129]),o($Va3,[2,506]),o($Va3,[2,509]),{346:[1,1265]},o($Va3,[2,792],{364:1266,362:1267,71:$Vf5}),{121:$VP,185:1269},o($Va3,[2,514]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1270,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($Va3,[2,517]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1271,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($VI,[2,534]),o($VI,[2,538]),o($VI,[2,548]),o($Vc3,[2,689]),o($Vc3,[2,818]),o($Vc3,[2,819]),o($VI,[2,448]),o($VI,[2,453],{327:1272,4:$V45,315:$V55,328:$V65}),o($Vg5,[2,455]),o($Vg5,[2,456]),{115:[1,1273]},{115:[1,1274]},{68:[1,1275],72:[2,463]},o($VF4,[2,491]),o($VF4,[2,466]),{176:[1,1283],182:[1,1284],334:1276,335:1277,336:1278,337:1279,338:1280,340:$VU4,341:[1,1281],342:[1,1285],345:[1,1282]},{3:1286,4:$V1,5:$V2},{37:1287,73:69,83:$V6,173:94,178:$Va},{384:[1,1288]},{385:[1,1289]},o($VZ4,[2,495]),{72:[1,1290]},o($Vr1,[2,313]),{72:[1,1291]},o($Vr1,[2,314]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1250,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,220:1292,222:1246,223:$Vc5,224:$Vd5,225:$Ve5,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:982,105:135,107:139,111:1293,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,228:980,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($Vr1,[2,299]),o($Vr1,[2,301]),o($Vo4,[2,435]),{3:1294,4:$V1,5:$V2},o($VI,[2,675],{71:[1,1295]}),{3:650,4:$V1,5:$V2,105:704,131:$VK3,134:$VL3,136:1296,308:703,309:705},{307:$V$4,310:$V05,432:1297},o($Vr4,[2,662]),{71:[1,1299],138:[1,1298],315:[1,1300]},{159:[1,1302],286:[1,1301]},{159:[1,1304],286:[1,1303]},{93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,286:[1,1305],288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},o($VF3,[2,236],{82:1306,151:[1,1307],157:[1,1309],158:[1,1308]}),{121:$VP,185:1310},{121:$VP,185:1311},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:982,105:135,107:139,111:1312,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,228:980,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},o($VI4,[2,234],{221:1313,68:$Vh5,226:[1,1315]}),o($Vi5,[2,228]),{135:[1,1316]},{71:[1,1317]},{71:[1,1318]},o($Vi5,[2,233],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),{72:[2,718],90:1319,93:[1,1321],96:1320},{93:[1,1322]},o($VJ4,[2,221],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),o($VJ4,[2,222],{68:$Vp4}),o($V25,[2,196]),o($V25,[2,197]),o($V25,[2,765]),o($V25,[2,199]),{3:1323,4:$V1,5:$V2,70:[1,1324]},o($V25,[2,204]),o($V25,[2,207]),{72:[1,1325]},{72:[1,1326]},o($VO4,[2,252]),{3:223,4:$V1,5:$V2,188:1327},o($Va3,[2,511]),o($Va3,[2,793]),{3:1328,4:$V1,5:$V2},{68:[1,1329]},{72:[1,1330],93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},{72:[1,1331],93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},o($Vg5,[2,454]),{3:1332,4:$V1,5:$V2},{121:$VP,185:1333},o($V75,$V85,{333:1217,332:1334,339:$V95}),o($Vc3,[2,468]),o($Vc3,[2,469]),o($Vc3,[2,470]),o($Vc3,[2,471]),o($Vc3,[2,472]),{342:[1,1335]},{342:[1,1336]},{3:1338,4:$V1,5:$V2,71:[2,788],354:1337},{3:1339,4:$V1,5:$V2},{3:1340,4:$V1,5:$V2},o($V75,[2,474]),o($VI,[2,796],{380:1341,382:1342,66:$VY4}),o($VI,[2,566]),o($VI,[2,567],{339:[1,1343]}),o($VZ4,[2,496]),o($Vr1,[2,315]),o([72,109],[2,316],{68:$Vh5}),{68:$VN4,72:[2,317]},o($VI,[2,674]),{3:650,4:$V1,5:$V2,94:1344,105:809},o($Vr4,[2,661],{68:$V84}),o($Vr4,[2,659]),{71:$V$3,131:$VS,133:805,134:$Vs1,141:$VU,170:$VY,190:806,279:$Vf1,313:1345,389:173,390:$Vi1,394:$Vj1},{3:650,4:$V1,5:$V2,94:1346,105:809},{138:[1,1347]},{311:$Va5,433:1348},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1349,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{311:$Va5,433:1350},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1351,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{311:$Va5,433:1352},o($VF3,[2,65]),{37:1353,73:69,83:$V6,153:[1,1354],173:94,178:$Va,227:[1,1355]},{37:1356,73:69,83:$V6,173:94,178:$Va,227:[1,1357]},{37:1358,73:69,83:$V6,173:94,178:$Va,227:[1,1359]},o($Vb5,[2,256],{233:1360,234:[1,1361]}),{235:1362,236:[2,766],476:[1,1363]},o($V15,[2,246],{68:$VN4}),o($VI4,[2,227]),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1250,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,222:1364,223:$Vc5,224:$Vd5,225:$Ve5,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1365,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{71:[1,1366]},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1250,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,220:1367,222:1246,223:$Vc5,224:$Vd5,225:$Ve5,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1250,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,220:1368,222:1246,223:$Vc5,224:$Vd5,225:$Ve5,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{72:[1,1369]},{72:[2,719]},{71:[1,1370]},{71:[1,1371]},o($V25,[2,200]),{3:1372,4:$V1,5:$V2},{3:1373,4:$V1,5:$V2,70:[1,1374]},{3:1375,4:$V1,5:$V2,70:[1,1376]},o($Va3,[2,790],{363:1377,362:1378,71:$Vf5}),{72:[1,1379]},{121:$VP,185:1380},o($Va3,[2,515]),o($Va3,[2,475]),o($Vg5,[2,457]),o($Vg5,[2,458]),o($VF4,[2,467]),{3:1382,4:$V1,5:$V2,71:[2,784],343:1381},{71:[1,1383]},{71:[1,1384]},{71:[2,789]},{71:[1,1385]},{71:[1,1386]},o($VI,[2,564]),o($VI,[2,797]),o($V75,$V85,{333:1217,332:1387,339:$V95}),{68:$Vp4,72:[1,1388]},o($Vr4,[2,668],{68:$Vn4}),{68:$Vp4,72:[1,1389]},o($Vr4,[2,670]),o($Vr4,[2,663]),{93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,286:[1,1390],288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},o($Vr4,[2,666]),{93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,286:[1,1391],288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,299:330,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2},o($Vr4,[2,664]),o($VF3,[2,237]),{37:1392,73:69,83:$V6,173:94,178:$Va,227:[1,1393]},{37:1394,73:69,83:$V6,173:94,178:$Va},o($VF3,[2,239]),{37:1395,73:69,83:$V6,173:94,178:$Va},o($VF3,[2,240]),{37:1396,73:69,83:$V6,173:94,178:$Va},o($Vb5,[2,254]),{121:$VP,185:1397},{236:[1,1398]},{236:[2,767]},o($Vi5,[2,229]),o($VI4,[2,235],{299:330,93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1250,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,220:1399,222:1246,223:$Vc5,224:$Vd5,225:$Ve5,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{68:$Vh5,72:[1,1400]},{68:$Vh5,72:[1,1401]},o($V24,[2,720],{91:1402,98:1403,3:1405,4:$V1,5:$V2,70:$Vj5}),{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1408,97:1406,99:1407,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:650,4:$V1,5:$V2,94:1409,105:809},o($V25,[2,201]),o($VJ4,[2,161]),{3:1410,4:$V1,5:$V2},o($VJ4,[2,163]),{3:1411,4:$V1,5:$V2},o($Va3,[2,510]),o($Va3,[2,791]),o($Va3,[2,508]),{72:[1,1412]},{71:[1,1413]},{71:[2,785]},{3:1415,4:$V1,5:$V2,122:$Vk5,344:1414},{3:650,4:$V1,5:$V2,94:1417,105:809},{3:650,4:$V1,5:$V2,94:1418,105:809},{3:650,4:$V1,5:$V2,94:1419,105:809},o($VI,[2,568]),o($VI,[2,676]),{138:[1,1420],315:[1,1421]},{311:$Va5,433:1422},{307:$V$4,310:$V05,432:1423},o($VF3,[2,238]),{37:1424,73:69,83:$V6,173:94,178:$Va},o($VF3,[2,241]),o($VF3,[2,243]),o($VF3,[2,244]),o($Vb5,[2,257]),{121:[2,768],237:1425,477:[1,1426]},{68:$Vh5,72:[1,1427]},o($Vi5,[2,231]),o($Vi5,[2,232]),o($V24,[2,67]),o($V24,[2,721]),{3:1428,4:$V1,5:$V2},o($V24,[2,71]),{68:[1,1430],72:[1,1429]},o($VF4,[2,73]),o($VF4,[2,74],{299:330,70:[1,1431],93:$VN1,106:$VO1,113:$VP1,114:$VQ1,115:$Vd3,123:$VS1,126:$VT1,128:$VU1,129:$VV1,130:$VW1,143:$VX1,159:$VY1,160:$VZ1,168:$V_1,169:$V$1,288:$V02,290:$V12,291:$V22,292:$V32,293:$V42,294:$V52,295:$V62,296:$V72,297:$V82,298:$V92,302:$Va2,303:$Vb2,304:$Vc2,305:$Vd2}),{68:$Vp4,72:[1,1432]},o($VJ4,[2,162]),o($VJ4,[2,164]),o($Va3,[2,512]),{3:1415,4:$V1,5:$V2,122:$Vk5,344:1433},{68:$Vl5,72:[1,1434]},o($VF4,[2,486]),o($VF4,[2,487]),{68:$Vp4,72:[1,1436]},{68:$Vp4,72:[1,1437]},{68:$Vp4,72:[1,1438]},{71:$V$3,131:$VS,133:805,134:$Vs1,141:$VU,170:$VY,190:806,279:$Vf1,313:1439,389:173,390:$Vi1,394:$Vj1},{138:[1,1440]},o($Vr4,[2,665]),o($Vr4,[2,667]),o($VF3,[2,242]),{121:$VP,185:1441},{121:[2,769]},o($Vi5,[2,230]),o($V24,[2,70]),{72:[2,69]},{3:152,4:$V1,5:$V2,52:149,71:$VO,88:1408,99:1442,105:135,107:139,121:$VP,122:$VQ,127:$VR,131:$VS,133:146,134:$VT,141:$VU,143:$VV,145:$VJ,147:151,168:$VW,169:$VX,170:$VY,185:137,189:133,190:141,191:142,241:136,242:132,243:134,244:138,245:140,246:143,247:144,248:145,249:147,251:$VZ,252:$Vb,253:$V_,254:$V$,256:$V01,263:$V11,264:$V21,265:$V31,266:$V41,267:$V51,268:$V61,269:$V71,270:$V81,271:$V91,273:$Va1,274:$Vb1,275:$Vc1,276:$Vd1,277:$Ve1,279:$Vf1,280:$Vg1,291:$Vh1,389:173,390:$Vi1,394:$Vj1},{3:1443,4:$V1,5:$V2},{72:[1,1444]},{68:$Vl5,72:[1,1445]},{346:[1,1446]},{3:1447,4:$V1,5:$V2,122:[1,1448]},o($Vc3,[2,483]),o($Vc3,[2,484]),o($Vc3,[2,485]),o($Vr4,[2,669],{68:$Vn4}),o($Vr4,[2,671]),o($Vm5,[2,770],{238:1449,476:[1,1450]}),o($VF4,[2,72]),o($VF4,[2,75]),o($V24,[2,722],{3:1405,95:1451,98:1452,4:$V1,5:$V2,70:$Vj5}),o($Vc3,[2,476]),{3:223,4:$V1,5:$V2,188:1453},o($VF4,[2,488]),o($VF4,[2,489]),o($Vb5,[2,772],{239:1454,384:[1,1455]}),o($Vm5,[2,771]),o($V24,[2,68]),o($V24,[2,723]),o($Vn5,[2,786],{347:1456,349:1457,71:[1,1458]}),o($Vb5,[2,255]),o($Vb5,[2,773]),o($Vc3,[2,479],{348:1459,350:1460,217:[1,1461]}),o($Vn5,[2,787]),{3:1415,4:$V1,5:$V2,122:$Vk5,344:1462},o($Vc3,[2,477]),{217:[1,1464],351:1463},{310:[1,1465]},{68:$Vl5,72:[1,1466]},o($Vc3,[2,480]),{307:[1,1467]},{352:[1,1468]},o($Vn5,[2,478]),{352:[1,1469]},{353:[1,1470]},{353:[1,1471]},{217:[2,481]},o($Vc3,[2,482])],
defaultActions: {99:[2,3],176:[2,318],177:[2,319],178:[2,320],179:[2,321],180:[2,322],181:[2,323],182:[2,324],183:[2,325],184:[2,326],190:[2,650],288:[2,813],295:[2,807],343:[2,774],344:[2,775],397:[2,651],463:[2,740],464:[2,741],576:[2,412],577:[2,413],578:[2,414],627:[2,652],981:[2,727],1035:[2,817],1138:[2,465],1320:[2,719],1338:[2,789],1363:[2,767],1382:[2,785],1426:[2,769],1429:[2,69],1470:[2,481]},
parseError: function parseError(str, hash) {
    if (hash.recoverable) {
        this.trace(str);
    } else {
        throw new Error(str);
    }
},
parse: function parse(input) {
    var self = this, stack = [0], tstack = [], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
    var args = lstack.slice.call(arguments, 1);
    var lexer = Object.create(this.lexer);
    var sharedState = { yy: {} };
    for (var k in this.yy) {
        if (Object.prototype.hasOwnProperty.call(this.yy, k)) {
            sharedState.yy[k] = this.yy[k];
        }
    }
    lexer.setInput(input, sharedState.yy);
    sharedState.yy.lexer = lexer;
    sharedState.yy.parser = this;
    if (typeof lexer.yylloc == 'undefined') {
        lexer.yylloc = {};
    }
    var yyloc = lexer.yylloc;
    lstack.push(yyloc);
    var ranges = lexer.options && lexer.options.ranges;
    if (typeof sharedState.yy.parseError === 'function') {
        this.parseError = sharedState.yy.parseError;
    } else {
        this.parseError = Object.getPrototypeOf(this).parseError;
    }
    function popStack(n) {
        stack.length = stack.length - 2 * n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }
    _token_stack:
        function lex() {
            var token;
            token = lexer.lex() || EOF;
            if (typeof token !== 'number') {
                token = self.symbols_[token] || token;
            }
            return token;
        }
    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
    while (true) {
        state = stack[stack.length - 1];
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol === null || typeof symbol == 'undefined') {
                symbol = lex();
            }
            action = table[state] && table[state][symbol];
        }
                    if (typeof action === 'undefined' || !action.length || !action[0]) {
                var errStr = '';
                expected = [];
                for (p in table[state]) {
                    if (this.terminals_[p] && p > TERROR) {
                        expected.push('\'' + this.terminals_[p] + '\'');
                    }
                }
                if (lexer.showPosition) {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                } else {
                    errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                }
                this.parseError(errStr, {
                    text: lexer.match,
                    token: this.terminals_[symbol] || symbol,
                    line: lexer.yylineno,
                    loc: yyloc,
                    expected: expected
                });
            }
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
        }
        switch (action[0]) {
        case 1:
            stack.push(symbol);
            vstack.push(lexer.yytext);
            lstack.push(lexer.yylloc);
            stack.push(action[1]);
            symbol = null;
            if (!preErrorSymbol) {
                yyleng = lexer.yyleng;
                yytext = lexer.yytext;
                yylineno = lexer.yylineno;
                yyloc = lexer.yylloc;
                if (recovering > 0) {
                    recovering--;
                }
            } else {
                symbol = preErrorSymbol;
                preErrorSymbol = null;
            }
            break;
        case 2:
            len = this.productions_[action[1]][1];
            yyval.$ = vstack[vstack.length - len];
            yyval._$ = {
                first_line: lstack[lstack.length - (len || 1)].first_line,
                last_line: lstack[lstack.length - 1].last_line,
                first_column: lstack[lstack.length - (len || 1)].first_column,
                last_column: lstack[lstack.length - 1].last_column
            };
            if (ranges) {
                yyval._$.range = [
                    lstack[lstack.length - (len || 1)].range[0],
                    lstack[lstack.length - 1].range[1]
                ];
            }
            r = this.performAction.apply(yyval, [
                yytext,
                yyleng,
                yylineno,
                sharedState.yy,
                action[1],
                vstack,
                lstack
            ].concat(args));
            if (typeof r !== 'undefined') {
                return r;
            }
            if (len) {
                stack = stack.slice(0, -1 * len * 2);
                vstack = vstack.slice(0, -1 * len);
                lstack = lstack.slice(0, -1 * len);
            }
            stack.push(this.productions_[action[1]][0]);
            vstack.push(yyval.$);
            lstack.push(yyval._$);
            newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
            stack.push(newState);
            break;
        case 3:
            return true;
        }
    }
    return true;
}};
/* generated by jison-lex 0.3.4 */
var lexer = (function(){
var lexer = ({

EOF:1,

parseError:function parseError(str, hash) {
        if (this.yy.parser) {
            this.yy.parser.parseError(str, hash);
        } else {
            throw new Error(str);
        }
    },

// resets the lexer, sets new input
setInput:function (input, yy) {
        this.yy = yy || this.yy || {};
        this._input = input;
        this._more = this._backtrack = this.done = false;
        this.yylineno = this.yyleng = 0;
        this.yytext = this.matched = this.match = '';
        this.conditionStack = ['INITIAL'];
        this.yylloc = {
            first_line: 1,
            first_column: 0,
            last_line: 1,
            last_column: 0
        };
        if (this.options.ranges) {
            this.yylloc.range = [0,0];
        }
        this.offset = 0;
        return this;
    },

// consumes and returns one char from the input
input:function () {
        var ch = this._input[0];
        this.yytext += ch;
        this.yyleng++;
        this.offset++;
        this.match += ch;
        this.matched += ch;
        var lines = ch.match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno++;
            this.yylloc.last_line++;
        } else {
            this.yylloc.last_column++;
        }
        if (this.options.ranges) {
            this.yylloc.range[1]++;
        }

        this._input = this._input.slice(1);
        return ch;
    },

// unshifts one char (or a string) into the input
unput:function (ch) {
        var len = ch.length;
        var lines = ch.split(/(?:\r\n?|\n)/g);

        this._input = ch + this._input;
        this.yytext = this.yytext.substr(0, this.yytext.length - len);
        //this.yyleng -= len;
        this.offset -= len;
        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
        this.match = this.match.substr(0, this.match.length - 1);
        this.matched = this.matched.substr(0, this.matched.length - 1);

        if (lines.length - 1) {
            this.yylineno -= lines.length - 1;
        }
        var r = this.yylloc.range;

        this.yylloc = {
            first_line: this.yylloc.first_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0)
                 + oldLines[oldLines.length - lines.length].length - lines[0].length :
              this.yylloc.first_column - len
        };

        if (this.options.ranges) {
            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
        }
        this.yyleng = this.yytext.length;
        return this;
    },

// When called from action, caches matched text and appends it on next action
more:function () {
        this._more = true;
        return this;
    },

// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
reject:function () {
        if (this.options.backtrack_lexer) {
            this._backtrack = true;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });

        }
        return this;
    },

// retain first n characters of the match
less:function (n) {
        this.unput(this.match.slice(n));
    },

// displays already matched input, i.e. for error messages
pastInput:function () {
        var past = this.matched.substr(0, this.matched.length - this.match.length);
        return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
    },

// displays upcoming input, i.e. for error messages
upcomingInput:function () {
        var next = this.match;
        if (next.length < 20) {
            next += this._input.substr(0, 20-next.length);
        }
        return (next.substr(0,20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
    },

// displays the character position where the lexing error occurred, i.e. for error messages
showPosition:function () {
        var pre = this.pastInput();
        var c = new Array(pre.length + 1).join("-");
        return pre + this.upcomingInput() + "\n" + c + "^";
    },

// test the lexed token: return FALSE when not a match, otherwise return token
test_match:function (match, indexed_rule) {
        var token,
            lines,
            backup;

        if (this.options.backtrack_lexer) {
            // save context
            backup = {
                yylineno: this.yylineno,
                yylloc: {
                    first_line: this.yylloc.first_line,
                    last_line: this.last_line,
                    first_column: this.yylloc.first_column,
                    last_column: this.yylloc.last_column
                },
                yytext: this.yytext,
                match: this.match,
                matches: this.matches,
                matched: this.matched,
                yyleng: this.yyleng,
                offset: this.offset,
                _more: this._more,
                _input: this._input,
                yy: this.yy,
                conditionStack: this.conditionStack.slice(0),
                done: this.done
            };
            if (this.options.ranges) {
                backup.yylloc.range = this.yylloc.range.slice(0);
            }
        }

        lines = match[0].match(/(?:\r\n?|\n).*/g);
        if (lines) {
            this.yylineno += lines.length;
        }
        this.yylloc = {
            first_line: this.yylloc.last_line,
            last_line: this.yylineno + 1,
            first_column: this.yylloc.last_column,
            last_column: lines ?
                         lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length :
                         this.yylloc.last_column + match[0].length
        };
        this.yytext += match[0];
        this.match += match[0];
        this.matches = match;
        this.yyleng = this.yytext.length;
        if (this.options.ranges) {
            this.yylloc.range = [this.offset, this.offset += this.yyleng];
        }
        this._more = false;
        this._backtrack = false;
        this._input = this._input.slice(match[0].length);
        this.matched += match[0];
        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
        if (this.done && this._input) {
            this.done = false;
        }
        if (token) {
            return token;
        } else if (this._backtrack) {
            // recover context
            for (var k in backup) {
                this[k] = backup[k];
            }
            return false; // rule action called reject() implying the next rule should be tested instead.
        }
        return false;
    },

// return next match in input
next:function () {
        if (this.done) {
            return this.EOF;
        }
        if (!this._input) {
            this.done = true;
        }

        var token,
            match,
            tempMatch,
            index;
        if (!this._more) {
            this.yytext = '';
            this.match = '';
        }
        var rules = this._currentRules();
        for (var i = 0; i < rules.length; i++) {
            tempMatch = this._input.match(this.rules[rules[i]]);
            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                match = tempMatch;
                index = i;
                if (this.options.backtrack_lexer) {
                    token = this.test_match(tempMatch, rules[i]);
                    if (token !== false) {
                        return token;
                    } else if (this._backtrack) {
                        match = false;
                        continue; // rule action called reject() implying a rule MISmatch.
                    } else {
                        // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
                        return false;
                    }
                } else if (!this.options.flex) {
                    break;
                }
            }
        }
        if (match) {
            token = this.test_match(match, rules[index]);
            if (token !== false) {
                return token;
            }
            // else: this is a lexer rule which consumes input without producing a token (e.g. whitespace)
            return false;
        }
        if (this._input === "") {
            return this.EOF;
        } else {
            return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), {
                text: "",
                token: null,
                line: this.yylineno
            });
        }
    },

// return next match that has a token
lex:function lex() {
        var r = this.next();
        if (r) {
            return r;
        } else {
            return this.lex();
        }
    },

// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
begin:function begin(condition) {
        this.conditionStack.push(condition);
    },

// pop the previously active lexer condition state off the condition stack
popState:function popState() {
        var n = this.conditionStack.length - 1;
        if (n > 0) {
            return this.conditionStack.pop();
        } else {
            return this.conditionStack[0];
        }
    },

// produce the lexer rule set which is active for the currently active lexer condition state
_currentRules:function _currentRules() {
        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
        } else {
            return this.conditions["INITIAL"].rules;
        }
    },

// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
topState:function topState(n) {
        n = this.conditionStack.length - 1 - Math.abs(n || 0);
        if (n >= 0) {
            return this.conditionStack[n];
        } else {
            return "INITIAL";
        }
    },

// alias for begin(condition)
pushState:function pushState(condition) {
        this.begin(condition);
    },

// return the number of states currently on the stack
stateStackSize:function stateStackSize() {
        return this.conditionStack.length;
    },
options: {"case-insensitive":true},
performAction: function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {
var YYSTATE=YY_START;
switch($avoiding_name_collisions) {
case 0:return 252
break;
case 1:return 279
break;
case 2:return 390
break;
case 3:return 5
break;
case 4:return 5
break;
case 5:return 275
break;
case 6:return 275
break;
case 7:return 122
break;
case 8:return 122
break;
case 9:return /* return COMMENT */
break;
case 10:/* skip whitespace */
break;
case 11:return 160
break;
case 12:return 159
break;
case 13:yy_.yytext = 'VALUE';return 178
break;
case 14:yy_.yytext = 'ROW';return 178
break;
case 15:yy_.yytext = 'COLUMN';return 178
break;
case 16:yy_.yytext = 'MATRIX';return 178
break;
case 17:yy_.yytext = 'INDEX';return 178
break;
case 18:yy_.yytext = 'RECORDSET';return 178
break;
case 19:yy_.yytext = 'TEXT';return 178
break;
case 20:yy_.yytext = 'SELECT';return 178
break;
case 21:return 'ABSOLUTE'
break;
case 22:return 353
break;
case 23:return 371
break;
case 24:return 270
break;
case 25:return 153
break;
case 26:return 369
break;
case 27:return 159
break;
case 28:return 216
break;
case 29:return 155
break;
case 30:return 196
break;
case 31:return 271
break;
case 32:return 70
break;
case 33:return 388
break;
case 34:return 229
break;
case 35:return 373
break;
case 36:return 328
break;
case 37:return 267
break;
case 38:return 408
break;
case 39:return 302
break;
case 40:return 412
break;
case 41:return 303
break;
case 42:return 290
break;
case 43:return 110
break;
case 44:return 472
break;
case 45:return 280
break;
case 46:return 254
break;
case 47:return 340
break;
case 48:return 120
break;
case 49:return 'CLOSE'
break;
case 50:return 230
break;
case 51:return 179
break;
case 52:return 179
break;
case 53:return 405
break;
case 54:return 339
break;
case 55:return 441
break;
case 56:return 411
break;
case 57:return 256
break;
case 58:return 227
break;
case 59:return 264
break;
case 60:return 319
break;
case 61:return 195
break;
case 62:return 225
break;
case 63:return 251
break;
case 64:return 'CURSOR'
break;
case 65:return 374
break;
case 66:return 419
break;
case 67:return 315
break;
case 68:return 310
break;
case 69:return 'DELETED'
break;
case 70:return 229
break;
case 71:return 375
break;
case 72:return 174
break;
case 73:return 365
break;
case 74:return 418
break;
case 75:return 125
break;
case 76:return 283
break;
case 77:return 359
break;
case 78:return 287
break;
case 79:return 289
break;
case 80:return 158
break;
case 81:return 472
break;
case 82:return 472
break;
case 83:return 277
break;
case 84:return 12
break;
case 85:return 274
break;
case 86:return 236
break;
case 87:return 268
break;
case 88:return 89
break;
case 89:return 345
break;
case 90:return 172
break;
case 91:return 474
break;
case 92:return 443
break;
case 93:return 219
break;
case 94:return 223
break;
case 95:return 226
break;
case 96:return 386
break;
case 97:return 145
break;
case 98:return 328
break;
case 99:return 304
break;
case 100:return 93
break;
case 101:return 182
break;
case 102:return 211
break;
case 103:return 311
break;
case 104:return 'INSERTED'
break;
case 105:return 157
break;
case 106:return 187
break;
case 107:return 210
break;
case 108:return 342
break;
case 109:return 269
break;
case 110:return 'LET'
break;
case 111:return 212
break;
case 112:return 106
break;
case 113:return 232
break;
case 114:return 431
break;
case 115:return 180	
break;
case 116:return 266
break;
case 117:return 423
break;
case 118:return 265
break;
case 119:return 158
break;
case 120:return 372
break;
case 121:return 209
break;
case 122:return 477
break;
case 123:return 253
break;
case 124:return 231
break;
case 125:return 352
break;
case 126:return 143
break;
case 127:return 276
break;
case 128:return 404
break;
case 129:return 217
break;
case 130:return 384
break;
case 131:return 234
break;
case 132:return 'OPEN'
break;
case 133:return 385
break;
case 134:return 160
break;
case 135:return 109
break;
case 136:return 197
break;
case 137:return 259
break;
case 138:return 161
break;
case 139:return 262
break;
case 140:return 475
break;
case 141:return 87
break;
case 142:return 14
break;
case 143:return 341
break;
case 144:return 413
break;
case 145:return 'PRIOR'
break;
case 146:return 13
break;
case 147:return 383
break;
case 148:return 183
break;
case 149:return 'REDUCE'
break;
case 150:return 346
break;
case 151:return 288
break;
case 152:return 'RELATIVE'
break;
case 153:return 101
break;
case 154:return 370
break;
case 155:return 164
break;
case 156:return 314
break;
case 157:return 414
break;
case 158:return 'RESTORE'
break;
case 159:return 162
break;
case 160:return 162
break;
case 161:return 213
break;
case 162:return 407
break;
case 163:return 224
break;
case 164:return 139
break;
case 165:return 476
break;
case 166:return 374
break;
case 167:return 83
break;
case 168:return 215
break;
case 169:return 135
break;
case 170:return 135
break;
case 171:return 378
break;
case 172:return 306
break;
case 173:return 387
break;
case 174:return 'STRATEGY'
break;
case 175:return 'STORE'
break;
case 176:return 263
break;
case 177:return 325
break;
case 178:return 325
break;
case 179:return 434
break;
case 180:return 329
break;
case 181:return 329
break;
case 182:return 181
break;
case 183:return 286
break;
case 184:return 'TIMEOUT'
break;
case 185:return 137
break;
case 186:return 184
break;
case 187:return 406
break;
case 188:return 406
break;
case 189:return 273
break;
case 190:return 422
break;
case 191:return 151
break;
case 192:return 176
break;
case 193:return 92
break;
case 194:return 307
break;
case 195:return 377
break;
case 196:return 218
break;
case 197:return 138
break;
case 198:return 124
break;
case 199:return 379
break;
case 200:return 285
break;
case 201:return 119
break;
case 202:return 410
break;
case 203:return 66
break;
case 204:return 406  /* Is this keyword required? */
break;
case 205:return 121
break;
case 206:return 121
break;
case 207:return 113
break;
case 208:return 127
break;
case 209:return 168
break;
case 210:return 291
break;
case 211:return 169
break;
case 212:return 123
break;
case 213:return 128
break;
case 214:return 298
break;
case 215:return 295
break;
case 216:return 297
break;
case 217:return 294
break;
case 218:return 292
break;
case 219:return 129
break;
case 220:return 293
break;
case 221:return 296
break;
case 222:return 130
break;
case 223:return 115
break;
case 224:return 296
break;
case 225:return 71
break;
case 226:return 72
break;
case 227:return 134
break;
case 228:return 394
break;
case 229:return 396
break;
case 230:return 398
break;
case 231:return 469
break;
case 232:return 471
break;
case 233:return 132
break;
case 234:return 68
break;
case 235:return 305
break;
case 236:return 141
break;
case 237:return 473
break;
case 238:return 131
break;
case 239:return 170
break;
case 240:return 126
break;
case 241:return 114
break;
case 242:return 4
break;
case 243:return 8
break;
case 244:return 'INVALID'
break;
}
},
rules: [/^(?:``([^\`])+``)/i,/^(?:\[\?\])/i,/^(?:@\[)/i,/^(?:\[([^\]])*?\])/i,/^(?:`([^\`])*?`)/i,/^(?:N(['](\\.|[^']|\\')*?['])+)/i,/^(?:X(['](\\.|[^']|\\')*?['])+)/i,/^(?:(['](\\.|[^']|\\')*?['])+)/i,/^(?:(["](\\.|[^"]|\\")*?["])+)/i,/^(?:--(.*?)($|\r\n|\r|\n))/i,/^(?:\s+)/i,/^(?:\|\|)/i,/^(?:&&)/i,/^(?:VALUE\s+OF\s+SELECT\b)/i,/^(?:ROW\s+OF\s+SELECT\b)/i,/^(?:COLUMN\s+OF\s+SELECT\b)/i,/^(?:MATRIX\s+OF\s+SELECT\b)/i,/^(?:INDEX\s+OF\s+SELECT\b)/i,/^(?:RECORDSET\s+OF\s+SELECT\b)/i,/^(?:TEXT\s+OF\s+SELECT\b)/i,/^(?:SELECT\b)/i,/^(?:ABSOLUTE\b)/i,/^(?:ACTION\b)/i,/^(?:ADD\b)/i,/^(?:AGGR\b)/i,/^(?:ALL\b)/i,/^(?:ALTER\b)/i,/^(?:AND\b)/i,/^(?:ANTI\b)/i,/^(?:ANY\b)/i,/^(?:APPLY\b)/i,/^(?:ARRAY\b)/i,/^(?:AS\b)/i,/^(?:ASSERT\b)/i,/^(?:ASC\b)/i,/^(?:ATTACH\b)/i,/^(?:AUTO(_)?INCREMENT\b)/i,/^(?:AVG\b)/i,/^(?:BEGIN\b)/i,/^(?:BETWEEN\b)/i,/^(?:BREAK\b)/i,/^(?:NOT\s+BETWEEN\b)/i,/^(?:NOT\s+LIKE\b)/i,/^(?:BY\b)/i,/^(?:CALL\b)/i,/^(?:CASE\b)/i,/^(?:CAST\b)/i,/^(?:CHECK\b)/i,/^(?:CLASS\b)/i,/^(?:CLOSE\b)/i,/^(?:COLLATE\b)/i,/^(?:COLUMN\b)/i,/^(?:COLUMNS\b)/i,/^(?:COMMIT\b)/i,/^(?:CONSTRAINT\b)/i,/^(?:CONTENT\b)/i,/^(?:CONTINUE\b)/i,/^(?:CONVERT\b)/i,/^(?:CORRESPONDING\b)/i,/^(?:COUNT\b)/i,/^(?:CREATE\b)/i,/^(?:CROSS\b)/i,/^(?:CUBE\b)/i,/^(?:CURRENT_TIMESTAMP\b)/i,/^(?:CURSOR\b)/i,/^(?:DATABASE(S)?)/i,/^(?:DECLARE\b)/i,/^(?:DEFAULT\b)/i,/^(?:DELETE\b)/i,/^(?:DELETED\b)/i,/^(?:DESC\b)/i,/^(?:DETACH\b)/i,/^(?:DISTINCT\b)/i,/^(?:DROP\b)/i,/^(?:ECHO\b)/i,/^(?:EDGE\b)/i,/^(?:END\b)/i,/^(?:ENUM\b)/i,/^(?:ELSE\b)/i,/^(?:ESCAPE\b)/i,/^(?:EXCEPT\b)/i,/^(?:EXEC\b)/i,/^(?:EXECUTE\b)/i,/^(?:EXISTS\b)/i,/^(?:EXPLAIN\b)/i,/^(?:FALSE\b)/i,/^(?:FETCH\b)/i,/^(?:FIRST\b)/i,/^(?:FOR\b)/i,/^(?:FOREIGN\b)/i,/^(?:FROM\b)/i,/^(?:GO\b)/i,/^(?:GRAPH\b)/i,/^(?:GROUP\b)/i,/^(?:GROUPING\b)/i,/^(?:HAVING\b)/i,/^(?:HELP\b)/i,/^(?:IF\b)/i,/^(?:IDENTITY\b)/i,/^(?:IS\b)/i,/^(?:IN\b)/i,/^(?:INDEX\b)/i,/^(?:INNER\b)/i,/^(?:INSERT\b)/i,/^(?:INSERTED\b)/i,/^(?:INTERSECT\b)/i,/^(?:INTO\b)/i,/^(?:JOIN\b)/i,/^(?:KEY\b)/i,/^(?:LAST\b)/i,/^(?:LET\b)/i,/^(?:LEFT\b)/i,/^(?:LIKE\b)/i,/^(?:LIMIT\b)/i,/^(?:MATCHED\b)/i,/^(?:MATRIX\b)/i,/^(?:MAX\b)/i,/^(?:MERGE\b)/i,/^(?:MIN\b)/i,/^(?:MINUS\b)/i,/^(?:MODIFY\b)/i,/^(?:NATURAL\b)/i,/^(?:NEXT\b)/i,/^(?:NEW\b)/i,/^(?:NOCASE\b)/i,/^(?:NO\b)/i,/^(?:NOT\b)/i,/^(?:NULL\b)/i,/^(?:OFF\b)/i,/^(?:ON\b)/i,/^(?:ONLY\b)/i,/^(?:OFFSET\b)/i,/^(?:OPEN\b)/i,/^(?:OPTION\b)/i,/^(?:OR\b)/i,/^(?:ORDER\b)/i,/^(?:OUTER\b)/i,/^(?:OVER\b)/i,/^(?:PATH\b)/i,/^(?:PARTITION\b)/i,/^(?:PERCENT\b)/i,/^(?:PIVOT\b)/i,/^(?:PLAN\b)/i,/^(?:PRIMARY\b)/i,/^(?:PRINT\b)/i,/^(?:PRIOR\b)/i,/^(?:QUERY\b)/i,/^(?:READ\b)/i,/^(?:RECORDSET\b)/i,/^(?:REDUCE\b)/i,/^(?:REFERENCES\b)/i,/^(?:REGEXP\b)/i,/^(?:RELATIVE\b)/i,/^(?:REMOVE\b)/i,/^(?:RENAME\b)/i,/^(?:REPEAT\b)/i,/^(?:REPLACE\b)/i,/^(?:REQUIRE\b)/i,/^(?:RESTORE\b)/i,/^(?:RETURN\b)/i,/^(?:RETURNS\b)/i,/^(?:RIGHT\b)/i,/^(?:ROLLBACK\b)/i,/^(?:ROLLUP\b)/i,/^(?:ROW\b)/i,/^(?:ROWS\b)/i,/^(?:SCHEMA(S)?)/i,/^(?:SEARCH\b)/i,/^(?:SEMI\b)/i,/^(?:SET\b)/i,/^(?:SETS\b)/i,/^(?:SHOW\b)/i,/^(?:SOME\b)/i,/^(?:SOURCE\b)/i,/^(?:STRATEGY\b)/i,/^(?:STORE\b)/i,/^(?:SUM\b)/i,/^(?:TABLE\b)/i,/^(?:TABLES\b)/i,/^(?:TARGET\b)/i,/^(?:TEMP\b)/i,/^(?:TEMPORARY\b)/i,/^(?:TEXTSTRING\b)/i,/^(?:THEN\b)/i,/^(?:TIMEOUT\b)/i,/^(?:TO\b)/i,/^(?:TOP\b)/i,/^(?:TRAN\b)/i,/^(?:TRANSACTION\b)/i,/^(?:TRUE\b)/i,/^(?:TRUNCATE\b)/i,/^(?:UNION\b)/i,/^(?:UNIQUE\b)/i,/^(?:UNPIVOT\b)/i,/^(?:UPDATE\b)/i,/^(?:USE\b)/i,/^(?:USING\b)/i,/^(?:VALUE(S)?)/i,/^(?:VERTEX\b)/i,/^(?:VIEW\b)/i,/^(?:WHEN\b)/i,/^(?:WHERE\b)/i,/^(?:WHILE\b)/i,/^(?:WITH\b)/i,/^(?:WORK\b)/i,/^(?:(\d*[.])?\d+[eE]\d+)/i,/^(?:(\d*[.])?\d+)/i,/^(?:->)/i,/^(?:#)/i,/^(?:\+)/i,/^(?:-)/i,/^(?:\*)/i,/^(?:\/)/i,/^(?:%)/i,/^(?:!===)/i,/^(?:===)/i,/^(?:!==)/i,/^(?:==)/i,/^(?:>=)/i,/^(?:>)/i,/^(?:<=)/i,/^(?:<>)/i,/^(?:<)/i,/^(?:=)/i,/^(?:!=)/i,/^(?:\()/i,/^(?:\))/i,/^(?:@)/i,/^(?:\{)/i,/^(?:\})/i,/^(?:\])/i,/^(?::-)/i,/^(?:\?-)/i,/^(?:\.)/i,/^(?:,)/i,/^(?:::)/i,/^(?::)/i,/^(?:;)/i,/^(?:\$)/i,/^(?:\?)/i,/^(?:!)/i,/^(?:\^)/i,/^(?:[a-zA-Z_][a-zA-Z_0-9]*)/i,/^(?:$)/i,/^(?:.)/i],
conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116,117,118,119,120,121,122,123,124,125,126,127,128,129,130,131,132,133,134,135,136,137,138,139,140,141,142,143,144,145,146,147,148,149,150,151,152,153,154,155,156,157,158,159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188,189,190,191,192,193,194,195,196,197,198,199,200,201,202,203,204,205,206,207,208,209,210,211,212,213,214,215,216,217,218,219,220,221,222,223,224,225,226,227,228,229,230,231,232,233,234,235,236,237,238,239,240,241,242,243,244],"inclusive":true}}
});
return lexer;
})();
parser.lexer = lexer;
function Parser () {
  this.yy = {};
}
Parser.prototype = parser;parser.Parser = Parser;
return new Parser;
})();


if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.Parser = parser.Parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); };
exports.main = function commonjsMain(args) {
    if (!args[1]) {
        console.log('Usage: '+args[0]+' FILE');
        process.exit(1);
    }
    var source = require('fs').readFileSync(require('path').normalize(args[1]), "utf8");
    return exports.parser.parse(source);
};
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(process.argv.slice(1));
}
}
/**
   12prettyflag.js - prettify
   @todo move this functionality to plugin
*/

/**
 	Pretty flag - nice HTML output or standard text without any tags
	@type {boolean}
*/

alasql.prettyflag = false;

/**
	Pretty output of SQL functions
	@function
	@param {string} sql SQL statement
	@param {boolean} flag value
	@return {string} HTML or text string with pretty output 
*/

alasql.pretty = function(sql, flag) {
	var pf = alasql.prettyflag;
	alasql.prettyflag = !flag;
	var s = alasql.parse(sql).toString();
	alasql.prettyflag = pf;
	return s;
};

/**
 Pretty keyword
 @param {string} s Keyword
 @return {string} pretty keyword
* /
function K(s){
	console.log('K')
	if(alasql.prettyflag) {
		return '<b style="color:blue">'+s.toUpperCase()+'</b>'; 
	} else {
		return s;
	}
}

/**
 Pretty 
 @param {string} 
 @return {string} pretty keyword
 * /
function P(s){
		console.log('P')
	if(alasql.prettyflag) {
		return '<span style="color:green">'+s+'</span>'; 
	} else {
		return s;
	}
}

/**
 Pretty 
 @param {string} 
 @return {string} pretty keyword
 * /
function L(s){
		console.log('L')
	if(alasql.prettyflag) {
		return '<span style="color:red">'+s+'</span>'; 
	} else {
		return s;
	}
}

/**
 Pretty number
 @param {string | number} s number 
 @return {string} pretty number
 * /
function N(s){
	console.log('N')
	if(alasql.prettyflag) {
		return '<span style="color:green">'+s+'</span>'; 
	} else {
		return s;
	}
}

/**
 Pretty string
 @param {string} s string 
 @return {string} pretty string
 * /
function S(s){
		console.log('S')
	if(alasql.prettyflag) {
		return '<span style="color:green">'+s+'</span>'; 
	} else {
		return s;
	}
}


/**
 Pretty new line
 @return {string} HTML new line character
 * /
function NL(){
		console.log('NL')
	if(alasql.prettyflag) {
		return '<br/>'; 
	} else {
		return ' '; // '\n'
	}	
}

/**
 Pretty ident
 @return {string} HTML ident
 * /
function ID(){
		console.log('ID')
	if(alasql.prettyflag) {
		return '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'; 
	} else {
		return ''; //'    ';
	}	
}


/*jshint unused:false*/
/*
    Utilities for Alasql.js

    @todo Review the list of utilities
    @todo Find more effective utilities
*/

/**
    Alasql utility functions
    @type {object}
 */
var utils = alasql.utils = {};

/**
    Convert NaN to undefined
    @function
    @param {string} s JavaScript string to be modified
    @return {string} Covered expression

    @example
    
    123         => 123
    undefined   => undefined
    NaN         => undefined

*/
function n2u(s) {
    return '(y='+s+',y===y?y:undefined)';
}

/**
    Return undefined if s undefined
    @param {string} s JavaScript string to be modified
    @return {string} Covered expression

    @example
    
    123,a       => a
    undefined,a => undefined
    NaN,a       => undefined

*/    
function und(s,r) {
    return '(y='+s+',typeof y=="undefined"?undefined:'+r+')';
}


/**
    Return always true. Stub for non-ecisting WHERE clause, because is faster then if(whenrfn) whenfn()
    @function
    @return {boolean} Always true
*/
function returnTrue () {return true;}

/**
    Return undefined. Stub for non-ecisting WHERE clause, because is faster then if(whenrfn) whenfn()
    @function
    @return {undefined} Always undefined
*/
function returnUndefined() {}

/**
    Escape quotes
    @function
    @param {string} s Source string
    @return {string} Escaped string
    @example
    
    Piter's => Piter\'s

*/
var escapeq = utils.escapeq = function(s) {
//    console.log(s);
    return s.replace(/\'/g,'\\\'');
};


/**
    Double quotes for SQL statements
    @param {string} s Source string
    @return {string} Escaped string

    @example
    
    Piter's => Piter''s

 */
var escapeqq = utils.undoubleq = function(s) {
    return s.replace(/(\')/g,'\'\'');
};

/**
    Replace double quotes with single quote
    @param {string} s Source string
    @return {string} Replaced string
    @example

    Piter''s => Piter's

 */
var doubleq = utils.doubleq = function(s) {
    return s.replace(/(\'\')/g,'\\\'');
};


/**
    Replace sigle quote to escaped single quote
    @param {string} s Source string
    @return {string} Replaced string

    @todo Chack this functions
    
*/
 var doubleqq = utils.doubleqq = function(s) {
    return s.replace(/\'/g,"\'");
};

/**
    Cut BOM first character for UTF-8 files (for merging two files)
    @param {string} s Source string
    @return {string} Replaced string    
*/

var cutbom = function(s) {
    if(s[0] === String.fromCharCode(65279)){
        s = s.substr(1);
    }
    return s;
}

/**
    Load text file from anywhere
    @param {string|object} path File path or HTML event
    @param {boolean} asy True - async call, false - sync call
    @param {function} success Success function
    @param {function} error Error function
    @return {string} Read data

    @todo Define Event type
*/
var loadFile = utils.loadFile = function(path, asy, success, error) {
    var data, fs;
    if((typeof exports === 'object') || (typeof Meteor !== 'undefined' && Meteor.isServer)) {

        
        if(typeof Meteor !== 'undefined') {
            /** For Meteor */
            fs = Npm.require('fs');
        } else {
            /** For Node.js */
            fs = require('fs');
        }

        /* If path is empty, than read data from stdin (for Node) */
        if(typeof path === 'undefined') {
            /* @type {string} Buffer for string*/
            var buff = '';
            process.stdin.setEncoding('utf8');
            process.stdin.on('readable', function() {
                var chunk = process.stdin.read();
                if (chunk !== null) {
                    buff += chunk.toString();
                }
            });
            process.stdin.on('end', function() {
               success(cutbom(buff));
            });
        } else {
            /* If async callthen call async*/
            if(asy) {
                fs.readFile(path,function(err,data){
                    if(err) {
                        throw err;
                    }
                    success(cutbom(data.toString()));
                });
            } else {
                /* Call sync version */
                data = fs.readFileSync(path);
                success(cutbom(data.toString()));
            }
        }
    } else if(typeof cordova === 'object') {
        /* If Cordova */
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
            fileSystem.root.getFile(path, {create:false}, function (fileEntry) {
                fileEntry.file(function(file){
                    var fileReader = new FileReader();
                    fileReader.onloadend = function(e){
                        success(cutbom(this.result));
                    };
                    fileReader.readAsText(file);
                });
            });
        });


/** @todo Check eliminated code below */

/*

        var paths = path.split('/');
        var filename = paths[paths.length-1];
        var dirpath = path.substr(0,path.length-filename.length);
 //       console.log('CORDOVA',filename,dirpath);
 //return success('[{"a":"'+filename+'"}]');

        window.resolveLocalFileSystemURL(dirpath, function(dir) {
            dir.getFile(filename, null, function(file) {
                file.file(function(file) {
                    var reader = new FileReader();
 //                   console.log('READ FILE 2');
                    reader.onloadend = function(e) {
//                    console.log('READ FILE 3',this.result);
                        success(this.result);
                    };
                    reader.readAsText(file);
                });
            });
        });    
*/
    } else {
        /* For string */
        if(typeof path === "string") {
            // For browser read from tag
            /*
                SELECT * FROM TXT('#one') -- read data from HTML element with id="one" 
            */
            if((path.substr(0,1) === '#') && (typeof document !== 'undefined')) {
                data = document.querySelector(path).textContent;
                success(data);
            } else {
                /* 
                    Simply read file from HTTP request, like:
                    SELECT * FROM TXT('http://alasql.org/README.md');
                */
                var xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === XMLHttpRequest.DONE) {
                        if (xhr.status === 200) {
                            if (success){
                                success(cutbom(xhr.responseText));
                            }
                        } else if (error){
                            error(xhr);
                        }
                        // Todo: else...?
                        
                    }
                };
                xhr.open("GET", path, asy); // Async
                xhr.send();
            }
        } else if(path instanceof Event) {
            /* 
                For browser read from files input element
                <input type="files" onchange="readFile(event)">
                <script>
                    function readFile(event) {
                        alasql('SELECT * FROM TXT(?)',[event])
                    }
                </script>
            */
            /** @type {array} List of files from <input> element */
            var files = path.target.files;
            /** type {object} */
            var reader = new FileReader();
            /** type {string} */
            var name = files[0].name;
            reader.onload = function(e) {
                var data = e.target.result;
                success(cutbom(data));
            };
            reader.readAsText(files[0]);    
        }
    }
};

/**
  @function Load binary file from anywhere
  @param {string} path File path
  @param {boolean} asy True - async call, false - sync call
  @param {function} success Success function
  @param {function} error Error function
  @return 1 for Async, data - for sync version
*/

var loadBinaryFile = utils.loadBinaryFile = function(path, asy, success, error) {
    var fs;
    if((typeof exports === 'object') || (typeof Meteor !== 'undefined' && Meteor.isServer)) {
        // For Node.js
        if(typeof Meteor !== 'undefined') {
            var fs = Npm.require('fs'); // For Meteor
        } else {
            var fs = require('fs');
        }
    // if(typeof exports == 'object') {
    //     // For Node.js
    //     var fs = require('fs');
        if(asy) {
            fs.readFile(path,function(err,data){
                if(err) {
                    throw err;
                }
                var arr = [];
                for(var i = 0; i < data.length; ++i){
                    arr[i] = String.fromCharCode(data[i]);
                }
                success(arr.join(""));
            });

        } else {
            var data = fs.readFileSync(path);
            var arr = [];
            for(var i = 0; i < data.length; ++i){
                arr[i] = String.fromCharCode(data[i]);
            }
            success(arr.join(""));
        }
//        success(data);
    } else {

        if(typeof path === "string") {
            // For browser
            var xhr = new XMLHttpRequest();
            xhr.open("GET", path, asy); // Async
            xhr.responseType = "arraybuffer";
            xhr.onload = function() {
                var data = new Uint8Array(xhr.response);
                var arr = [];
                for(var i = 0; i < data.length; ++i){
                    arr[i] = String.fromCharCode(data[i]);
                }
                success(arr.join(""));
            }
            xhr.send();
        } else if(path instanceof Event) {
            // console.log("event");
            var files = path.target.files;
            var reader = new FileReader();
            var name = files[0].name;
            reader.onload = function(e) {
                var data = e.target.result;
                success(data);
            };
            reader.readAsBinaryString(files[0]);    
        } else if(path instanceof Blob) {
        	success(path);
        } 
    }
};


var removeFile = utils.removeFile = function(path,cb) {
    if(typeof exports === 'object') {
        var fs = require('fs');
        fs.remove(path,cb);
    } else if(typeof cordova === 'object') {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
            fileSystem.root.getFile(path, {create:false}, function (fileEntry) {
                fileEntry.remove(cb);
                cb && cb(); // jshint ignore:line
            }, function(){
                cb && cb(); // jshint ignore:line
            });
        });
    } else {
        throw new Error('You can remove files only in Node.js and Apache Cordova');
    }
};


var deleteFile = utils.deleteFile = function(path,cb){
    if(typeof exports === 'object') {
        var fs = require('fs');
        fs.unlink(path, cb);
    }
};

var fileExists = utils.fileExists = function(path,cb){
    if(typeof exports === 'object') {
        var fs = require('fs');
        fs.exists(path,cb);
    } else if(typeof cordova === 'object') {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
            fileSystem.root.getFile(path, {create:false}, function (fileEntry) {
                cb(true);
            }, function(){
                cb(false);
            });
        });
/*        
        function fail(){
            callback(false);            
        }
        try {
            // Cordova
            var paths = path.split('/');
            var filename = paths[paths.length-1];
            var dirpath = path.substr(0,path.length-filename.length);

            window.resolveLocalFileSystemURL(dirpath, function(dir) {
                dir.getFile(filename, null, function(file) {
                    file.file(function(file) {
                        callback(true);
                    },fail);
                },fail);
            },fail);
        } catch(err) {
            fail();
        };
*/
    } else {
        // TODO Cordova, etc.
        throw new Error('You can use exists() only in Node.js or Apach Cordova');
    }
};

/**
  Save text file from anywhere
  @param {string} path File path
  @param {array} data Data object
  @param {function} cb Callback
*/

var saveFile = utils.saveFile = function(path, data, cb) {
    var res = 1;
    if(path === undefined) {
        //
        // Return data into result variable
        // like: alasql('SELECT * INTO TXT() FROM ?',[data]);
        //
        res = data;
        if(cb){
            res = cb(res);
        }
    } else {

        if(typeof exports === 'object') {
            // For Node.js
            var fs = require('fs');
            data = fs.writeFileSync(path,data);
            if(cb){
                res = cb(res);
            }
        } else if(typeof cordova === 'object') {
            // For Apache Cordova
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function (fileSystem) {
//                alasql.utils.removeFile(path,function(){
                    fileSystem.root.getFile(path, {create:true}, function (fileEntry) {
                        fileEntry.createWriter(function(fileWriter) {
                            fileWriter.onwriteend = function(){
                                if(cb){
                                    res = cb(res);
                                }
                            }
                            fileWriter.write(data);
                        });                                  
                    });
 //               });
            });

/*
        } else if((typeof cordova == 'object') && cordova.file) {
//            console.log('saveFile 1');
        // Cordova
            var paths = path.split('/');
            var filename = paths[paths.length-1];
            var dirpath = path.substr(0,path.length-filename.length);
     //       console.log('CORDOVA',filename,dirpath);
     //return success('[{"a":"'+filename+'"}]');

            window.resolveLocalFileSystemURL(dirpath, function(dir) {
//            console.log('saveFile 2');

                dir.getFile(filename, {create:true}, function(file) {
//            console.log('saveFile 3');

//                    file.file(function(file) {
//            console.log('saveFile 4');

                        file.createWriter(function(fileWriter) {
        
//        fileWriter.seek(fileWriter.length);
        
                            var blob = new Blob([data], {type:'text/plain'});
                            fileWriter.write(blob);
                            fileWriter.onwriteend = function(){
                                if(cb) cb();
                            };
//                        console.log("ok, in theory i worked");
                        });          
*/
/*
                        // Corodva
                        function writeFinish() {
                            // ... your done code here...
                            return cb()
                        };
                        var written = 0;
                          var BLOCK_SIZE = 1*1024*1024; // write 1M every time of write
                          function writeNext(cbFinish) {
                            var sz = Math.min(BLOCK_SIZE, data.length - written);
                            var sub = data.slice(written, written+sz);
                            writer.write(sub);
                            written += sz;
                            writer.onwrite = function(evt) {
                              if (written < data.length)
                                writeNext(cbFinish);
                              else
                                cbFinish();
                            };
                          }
                          writeNext(writeFinish);
                        }
*/                        
//                     });
//                });
//            });
        } else {
        	if(isIE() === 9) {
        		// Solution was taken from 
        		// http://megatuto.com/formation-JAVASCRIPT.php?JAVASCRIPT_Example=Javascript+Save+CSV+file+in+IE+8/IE+9+without+using+window.open()+Categorie+javascript+internet-explorer-8&category=&article=7993
//				var URI = 'data:text/plain;charset=utf-8,';

				// Prepare data
				var ndata = data.replace(/\r\n/g,'&#A;&#D;');
				ndata = ndata.replace(/\n/g,'&#D;');
				ndata = ndata.replace(/\t/g,'&#9;');
				var testlink = window.open("about:blank", "_blank");
				testlink.document.write(ndata); //fileData has contents for the file
				testlink.document.close();
				testlink.document.execCommand('SaveAs', false, path);
				testlink.close();         		
        	} else {
	            var blob = new Blob([data], {type: "text/plain;charset=utf-8"});
	            saveAs(blob, path);
	            if(cb){
                    res = cb(res);
                }                		
        	}
        }
    }

    return res;
}

/** 
    @function Is this IE9 
    @return {boolean} True for IE9 and false for other browsers

    For IE9 compatibility issues
*/
function isIE () {
  var myNav = navigator.userAgent.toLowerCase();
  return (myNav.indexOf('msie') !== -1) ? parseInt(myNav.split('msie')[1]) : false;
}


// For LOAD
// var saveBinaryFile = utils.saveFile = function(path, data, cb) {
//     if(typeof exports == 'object') {
//         // For Node.js
//         var fs = require('fs');
//         var data = fs.writeFileSync(path,data);
//     } else {
//         var blob = new Blob([data], {type: "text/plain;charset=utf-8"});
//         saveAs(blob, path);        
//     }
// };


// Fast hash function

/**
  @function Hash string to integer number
  @param {string} str Source string
  @return {integer} hash number
*/

var hash = utils.hash = function hash(str){
    var h = 0;
    
    if (0 === str.length){
        return h;
    }

    for (var i = 0; i < str.length; i++) {
        h = ((h<<5)-h)+str.charCodeAt(i);
        h = h & h; 
   	}
    
    return h;
};

/**
    Union arrays
    @function
    @param {array} a
    @param {array} b
    @return {array}
*/
var arrayUnion = utils.arrayUnion = function (a,b) {
    var r = b.slice(0);
    a.forEach(function(i){ 
                            if (r.indexOf(i) < 0){ 
                                r.push(i);
                            } 
                        });
    return r;
}

/** 
 Array Difference
 */
var arrayDiff = utils.arrayDiff  = function (a,b) {
    return a.filter(function(i) {return b.indexOf(i) < 0;});
};

/**
  Arrays deep intersect (with records)
 */
var arrayIntersect = utils.arrayIntersect  = function(a,b) {
    var r = [];
    a.forEach(function(ai) {
        var found = false;
        
        b.forEach(function(bi){
            found = found || (ai===bi);
        });

        if(found) {
            r.push(ai); 
        }
    });
    return r;
};


/**
  Arrays deep union (with records)
 */
var arrayUnionDeep = utils.arrayUnionDeep = function (a,b) {
    var r = b.slice(0);
    a.forEach(function(ai) {
        var found = false;
        
        r.forEach(function(ri){
//            found = found || equalDeep(ai, ri, true);
            found = found || deepEqual(ai, ri);
        });

        if(!found) {
            r.push(ai); 
        }
    });
    return r;
};

/**
  Arrays deep union (with records)
 */
var arrayExceptDeep = utils.arrayExceptDeep = function (a,b) {
    var r = [];
    a.forEach(function(ai) {
        var found = false;
        
        b.forEach(function(bi){
//            found = found || equalDeep(ai, bi, true);
            found = found || deepEqual(ai, bi);
        });

        if(!found) {
            r.push(ai); 
        }
    });
    return r;
};

/**
  Arrays deep intersect (with records)
 */
var arrayIntersectDeep = utils.arrayIntersectDeep  = function(a,b) {
    var r = [];
    a.forEach(function(ai) {
        var found = false;
        
        b.forEach(function(bi){
//            found = found || equalDeep(ai, bi, true);
            found = found || deepEqual(ai, bi, true);
        });

        if(found) {
            r.push(ai); 
        }
    });
    return r;
};

/** 
  Deep clone obects
 */
var cloneDeep = utils.cloneDeep = function cloneDeep(obj) {
    if(null === obj || typeof(obj) !== 'object'){
        return obj;
    }
    
    if(obj instanceof Date) {
	return new Date(obj);
    }

    var temp = obj.constructor(); // changed

    for(var key in obj) {
        if(obj.hasOwnProperty(key)) {
            temp[key] = cloneDeep(obj[key]);
        }
    }
    return temp;
};

/**
  Check equality of objects
*/

/*
var equalDeep = utils.equalDeep = function equalDeep (x, y, deep) {
    if (deep) {
        if (x === y){
            return true;
        }

        var p;
        for (p in y) {
            if (typeof (x[p]) === 'undefined') { return false; }
        }

        for (p in y) {
            if (y[p]) {
                switch (typeof (y[p])) {
                    case 'object':
                        if (!equalDeep(y[p],x[p])) { return false; } break;
                    case 'function':
                        if (
                                typeof (x[p]) === 'undefined' ||
                                (p !== 'equals' && y[p].toString() !== x[p].toString())
                            ){
                                return false;
                            }
                        break;
                    default:
                        if (y[p] !== x[p]) { return false; }
                }
            } else {
                if (x[p]){
                    return false;
                }
            }
        }

        for (p in x) {
            if (typeof (y[p]) === 'undefined') { return false; }
        }

        return true;
    }
    return x === y;
};
*/

/**
  COmpare two object in deep
 */
var deepEqual = utils.deepEqual = function(x, y) {
    if (typeof x === "object" && null !== x && (typeof y === "object" && null !== y)) {
        if (Object.keys(x).length !== Object.keys(y).length) {
            return false;
        }
        for (var prop in x) {
            if (y.hasOwnProperty(prop)) {
                if (!deepEqual(x[prop], y[prop])) {
                    return false;
                }
            } else {
                return false;
            }
        }
        return true;
    } else {
        if (x !== y) {
            return false;
        } else {
            return true;
        }
    }
};
/**
    Array with distinct records
    @param {array} data
    @return {array}
*/
var distinctArray = utils.distinctArray = function(data) {
    var uniq = {};
    // TODO: Speedup, because Object.keys is slow
    for(var i=0,ilen=data.length;i<ilen;i++) {
        var uix;
        if(typeof data[i] === 'object') {
            uix = Object.keys(data[i]).sort().map(function(k){return k+'`'+data[i][k];}).join('`');
        } else {
            uix = data[i];  
        }
        uniq[uix] = data[i];
    }
    var res = [];
    for(var key in uniq){
        res.push(uniq[key]);
    }
    return res;
};


/** 
    Extend object a with properties of b
    @function 
    @param {object} a
    @param {object} b
    @return {object}
*/
var extend = utils.extend = function extend (a,b){
    a = a || {};
    for(var key in b) {
        if(b.hasOwnProperty(key)) {
            a[key] = b[key];
        }
    }
    return a;
};

/**
   Flat array by first row
 */
var flatArray = utils.flatArray = function(a) {
//console.log(684,a);
    if(!a || 0 === a.length){ 
        return [];
    }

    // For recordsets
    if(typeof a === 'object' && a instanceof alasql.Recordset) {
        return a.data.map(function(ai){return ai[a.columns[0].columnid];});
    }
    // Else for other arrays
    var key = Object.keys(a[0])[0];
    if(key === undefined){
        return [];
    }
    return a.map(function(ai) {return ai[key];});
};

/**
  Convert array of objects to array of arrays
 */
var arrayOfArrays = utils.arrayOfArrays = function (a) {
    return a.map(function(aa){
        var ar = [];
        for(var key in aa){
            ar.push(aa[key]);
        }
        return ar;
    });
};

/**
    Excel:convert number to Excel column, like 1 => 'A'
    @param {integer} i Column number, starting with 0
    @return {string} Column name, starting with 'A'
*/

var xlsnc = utils.xlsnc = function(i) {
    var addr = String.fromCharCode(65+i%26);
    if(i>=26) {
        i=((i/26)|0)-1;
        addr = String.fromCharCode(65+i%26)+addr;
        if(i>26) {
            i=((i/26)|0)-1;
            addr = String.fromCharCode(65+i%26)+addr;
        }
    }
    return addr;
};

/**
    Excel:conver Excel column name to number
    @param {string} s Column number, like 'A' or 'BE'
    @return {string} Column name, starting with 0
*/
var xlscn = utils.xlscn = function(s) {
    var n = s.charCodeAt(0)-65;
    if(s.length>1) {
        n = (n+1)*26+s.charCodeAt(1)-65;
//        console.log(n, s.charCodeAt(0)-65, s.charCodeAt(1)-65);
        if(s.length>2) {
            n = (n+1)*26+s.charCodeAt(2)-65;
        }
    }
    return n;
};

var domEmptyChildren = utils.domEmptyChildren = function (container){
  var len = container.childNodes.length;
  while (len--) {
    container.removeChild(container.lastChild);
  }
};


/**
    SQL LIKE emulation
    @parameter {string} pattern Search pattern
    @parameter {string} value Searched value
    @parameter {string} escape Escape character (optional)
    @return {boolean} If value LIKE pattern ESCAPE escape
*/

var like = utils.like = function (pattern,value,escape) {
    // Verify escape character
    if(!escape) escape = '';

    var i=0;
    var s = '^';

    while(i<pattern.length) {
      var c = pattern[i], c1 = '';
      if(i<pattern.length-1) c1 = pattern[i+1];

      if(c === escape) {
        s += '\\'+c1;
        i++;
      } else if(c==='[' && c1 === '^') {
        s += '[^';
        i++;
      } else if(c==='[' || c===']' ) {
        s += c;
      } else if(c==='%') {
        s += '.*';
      } else if(c === '_') {
        s += '.';
      } else if('/.*+?|(){}'.indexOf(c)>-1) {
        s += '\\'+c;
      } else {
        s += c;
      }
      i++;
    }

    s += '$';
//    if(value == undefined) return false;
//console.log(s,value,(value||'').search(RegExp(s))>-1);
    return (value||'').search(RegExp(s))>-1;
   }




/**
 	Strip all comments.
 	@function
 	@param {string} str
 	@return {string}
 	Based om the https://github.com/lehni/uncomment.js/blob/master/uncomment.js
 	I just replaced JavaScript's '//' to SQL's '--' and remove other stuff
 
 	@todo Fixed [aaa/*bbb] for column names
 	@todo Bug if -- comments in the last line
	@todo Check if it possible to model it with Jison parser
	@todo Remove unused code
 */

alasql.utils.uncomment = function uncomment(str) {
	// Add some padding so we can always look ahead and behind by two chars
	str = ('__' + str + '__').split('');
	var quote = false,
		quoteSign,
		// regularExpression = false,
		// characterClass = false,
		blockComment = false,
		lineComment = false;
		// preserveComment = false;

	for (var i = 0, l = str.length; i < l; i++) {
//		console.log(i,str[i]);
		// When checking for quote escaping, we also need to check that the
		// escape sign itself is not escaped, as otherwise '\\' would cause
		// the wrong impression of an unclosed string:
		var unescaped = str[i - 1] !== '\\' || str[i - 2] === '\\';

		if (quote) {
			if (str[i] === quoteSign && unescaped){
				quote = false;
			}
		// } else if (regularExpression) {
			// Make sure '/'' inside character classes is not considered the end
			// of the regular expression.
			// if (str[i] === '[' && unescaped) {
			// 	characterClass = true;
			// } else if (str[i] === ']' && unescaped && characterClass) {
			// 	characterClass = false;
			// } else if (str[i] === '/' && unescaped && !characterClass) {
			// 	regularExpression = false;
			// }
		} else if (blockComment) {
			// Is the block comment closing?
			if (str[i] === '*' && str[i + 1] === '/') {
				// if (!preserveComment)
					str[i] = str[i + 1] = '';
				blockComment /* = preserveComment*/ = false;
				// Increase by 1 to skip closing '/', as it would be mistaken
				// for a regexp otherwise
				i++;
			} else { //if (!preserveComment) {
				str[i] = '';
			}
		} else if (lineComment) {
			// One-line comments end with the line-break
			if (str[i + 1] === '\n' || str[i + 1] === '\r'){
				lineComment = false;
			}
			str[i] = '';
		} else {
			if (str[i] === '"' || str[i] === "'") {
				quote = true;
				quoteSign = str[i];
			} else if (str[i] === '[' && str[i-1] !== "@") {
				quote = true;
				quoteSign = ']';
			// } else if (str[i] === '-' &&  str[i + 1] === '-') {
			// 	str[i] = '';
			// 	lineComment = true;
			} else if (str[i] === '/' && str[i + 1] === '*') {
					// Do not filter out conditional comments /*@ ... */
					// and comments marked as protected /*! ... */
//					preserveComment = /[@!]/.test(str[i + 2]);
//					if (!preserveComment)
					str[i] = '';
					blockComment = true;
//					console.log('block');
				// } else if (str[i + 1] === '/') {
				// 	str[i] = '';
				// 	lineComment = true;
				// } else {
					// We need to make sure we don't count normal divisions as
					// regular expresions. Matching this properly is difficult,
					// but if we assume that normal division always have a space
					// after /, a simple check for white space or '='' (for /=)
					// is enough to distinguish divisions from regexps.
					// TODO: Develop a proper check for regexps.
					// if (!/[\s=]/.test(str[i + 1])) {
					// 	regularExpression = true;
					// }
				// }
			}
		}
	}
	// Remove padding again.
	str = str.join('').slice(2, -2);

/*
	// Strip empty lines that contain only white space and line breaks, as they
	// are left-overs from comment removal.
	str = str.replace(/^[ \t]+(\r\n|\n|\r)/gm, function(all) {
		return '';
	});
	// Replace a sequence of more than two line breaks with only two.
	str = str.replace(/(\r\n|\n|\r)(\r\n|\n|\r)+/g, function(all, lineBreak) {
		return lineBreak + lineBreak;
	});
*/
	return str;
};


/**
	Database class for Alasql.js
*/


// Initial parameters

/**
	Jison parser
*/
alasql.parser = parser;

/**
 	Jison parser
 	@param {string} sql SQL statement
 	@return {object} AST (Abstract Syntax Tree)

 	@todo Create class AST
 	@todo Add other parsers

 	@example
 	alasql.parse = function(sql) {
		// My own parser here
 	}
 */
alasql.parse = function(sql) {
	return parser.parse(alasql.utils.uncomment(sql));
}; 

/**
 	List of engines of external databases
 	@type {object}
 	@todo Create collection type
 */
alasql.engines = {};

/**
 	List of databases
 	@type {object}
 */
alasql.databases = {};

/** 
	Number of databases 
	@type {number}
*/
alasql.databasenum = 0; 

/**
 	Alasql options object
 */
alasql.options = {};
alasql.options.errorlog = false; // Log or throw error
alasql.options.valueof = false; // Use valueof in orderfn
alasql.options.dropifnotexists = false; // DROP database in any case
alasql.options.datetimeformat = 'sql'; // How to handle DATE and DATETIME types
								// Another value is 'javascript'
alasql.options.casesensitive = true; // Table and column names are case sensitive and converted to lower-case
alasql.options.logtarget = 'output'; // target for log. Values: 'console', 'output', 'id' of html tag
alasql.options.logprompt = true; // Print SQL at log

// Default modifier
// values: RECORDSET, VALUE, ROW, COLUMN, MATRIX, TEXTSTRING, INDEX
alasql.options.modifier = undefined; 
// How many rows to lookup to define columns
alasql.options.columnlookup = 10; 
// Create vertex if not found
alasql.options.autovertex = true;

// Use dbo as current database (for partial T-SQL comaptibility)
alasql.options.usedbo = true;

// AUTOCOMMIT ON | OFF
alasql.options.autocommit = true;

// Use cache
alasql.options.cache = true;

// Compatibility flags
alasql.options.tsql = true;
alasql.options.mysql = true;
alasql.options.postgres = true;
alasql.options.oracle = true;
alasql.options.sqlite = true;
alasql.options.orientdb = true;

// for SET NOCOUNT OFF
alasql.options.nocount = false;

// Check for NaN and convert it to undefined
alasql.options.nan = false;

//alasql.options.worker = false;
// Variables
alasql.vars = {};
alasql.declares = {};


alasql.prompthistory = [];

alasql.plugins = {}; // If plugin already loaded

alasql.from = {}; // FROM functions
alasql.into = {}; // INTO functions

alasql.fn = {};
alasql.aggr = {};

alasql.busy = 0;

// Cache
alasql.MAXSQLCACHESIZE = 10000;
alasql.DEFAULTDATABASEID = 'alasql';

/* WebWorker */
alasql.lastid = 0;
alasql.buffer = {};

/**
  Select current database
  @param {string} databaseid Selected database identificator
 */
alasql.use = function (databaseid) {
	if(!databaseid){
		databaseid = alasql.DEFAULTDATABASEID;
	}
	if(alasql.useid === databaseid){
		return;
	}
	alasql.useid = databaseid;
	var db = alasql.databases[alasql.useid];
	alasql.tables = db.tables;
//	alasql.fn = db.fn;
	db.resetSqlCache();
	if(alasql.options.usedbo) {
	    alasql.databases.dbo = db; // Operator???
	}

};

/**
 Run single SQL statement on current database
 */
alasql.exec = function (sql, params, cb, scope) {
	delete alasql.error;
	params = params || {};
	if(alasql.options.errorlog){
		try {
			return alasql.dexec(alasql.useid, sql, params, cb, scope);
		} catch(err){
			alasql.error = err;
			if(cb){ 
				cb(null,alasql.error);
			}
		}
	} else {
		return alasql.dexec(alasql.useid, sql, params, cb, scope);
	}
};

/**
 Run SQL statement on specific database
 */
alasql.dexec = function (databaseid, sql, params, cb, scope) {
	var db = alasql.databases[databaseid];
//	if(db.databaseid != databaseid) console.trace('got!');
//	console.log(3,db.databaseid,databaseid);
	
	var hh;
	// Create hash
	if(alasql.options.cache) {
		hh = hash(sql);
		var statement = db.sqlCache[hh];
		// If database structure was not changed sinse lat time return cache
		if(statement && db.dbversion === statement.dbversion) {
			return statement(params, cb);
		}
	}

	// Create AST
	var ast = alasql.parse(sql);
	if(!ast.statements){
		return;
	}
	if(0 === ast.statements.length){
		return 0;
	}
	else if(1 === ast.statements.length) {
		if(ast.statements[0].compile) {

			// Compile and Execute
			var statement = ast.statements[0].compile(databaseid);
			if(!statement){
				return;
			}
			statement.sql = sql;
			statement.dbversion = db.dbversion;
			
			if(alasql.options.cache) {
				// Secure sqlCache size
				if (db.sqlCacheSize > alasql.MAXSQLCACHESIZE) {
					db.resetSqlCache();
				}
				db.sqlCacheSize++;
				db.sqlCache[hh] = statement;
			}
			var res = alasql.res = statement(params, cb, scope);
			return res;
			
		} else {
//			console.log(ast.statements[0]);
			alasql.precompile(ast.statements[0],alasql.useid,params);
			var res = alasql.res = ast.statements[0].execute(databaseid, params, cb, scope);		
			return res;
		}
	} else {
		// Multiple statements
		if(cb) {
			alasql.adrun(databaseid, ast, params, cb, scope);
		} else {
			return alasql.drun(databaseid, ast, params, cb, scope);
		}
	}
};

/**
  Run multiple statements and return array of results sync
 */
alasql.drun = function (databaseid, ast, params, cb, scope) {
	var useid = alasql.useid;
	
	if(useid !== databaseid){
		alasql.use(databaseid);
	}
	
	var res = [];
	for (var i=0, ilen=ast.statements.length; i<ilen; i++) {
		if(ast.statements[i]) {
			if(ast.statements[i].compile) { 
				var statement = ast.statements[i].compile(alasql.useid);
				res.push(alasql.res = statement(params,null,scope));
			} else {
				alasql.precompile(ast.statements[i],alasql.useid,params);
				res.push(alasql.res = ast.statements[i].execute(alasql.useid, params));
			}		
		}
	}
	if(useid !== databaseid){
		alasql.use(useid);
	}
	
	if(cb){
		cb(res);
	}
	
	alasql.res = res;
	
	return res;
};

/**
  Run multiple statements and return array of results async
 */
alasql.adrun = function (databaseid, ast, params, cb, scope) {
//	alasql.busy++;
	var useid = alasql.useid;
	if(useid !== databaseid) {
		alasql.use(databaseid);
	}
	var res = [];

	

	function adrunone(data) {
		if(data !== undefined){ 
			res.push(data);
		}
		var astatement = ast.statements.shift();
		if(!astatement) {
			if(useid !== databaseid){
				alasql.use(useid);
			}
			cb(res);
//			alasql.busy--;
//			if(alasql.busy<0) alasql.busy = 0;
		} else {
			if(astatement.compile) {
				var statement = astatement.compile(alasql.useid);
				statement(params, adrunone, scope);
			} else {
				alasql.precompile(ast.statements[0],alasql.useid,params);
				astatement.execute(alasql.useid, params, adrunone);
			}
		}
	}

	adrunone(); /** @todo Check, why data is empty here */
};



/**
 Compile statement to JavaScript function
 @param {string} sql SQL statement
 @param {string} databaseid Database identificator
 @return {functions} Compiled statement functions
*/
alasql.compile = function(sql, databaseid) {
	
	databaseid = databaseid || alasql.useid;
	
	var ast = alasql.parse(sql); // Create AST
	
	if(1 === ast.statements.length) {
		var statement = ast.statements[0].compile(databaseid)
		statement.promise = function(params){
		    return new Promise(function(resolve, reject){
		        statement(params, function(data,err) {
		             if(err) {
		                 reject(err);
		             } else {
		                 resolve(data);
		             }
		        });
		    });
		};

		return statement;
/*		
		if(kind == 'value') {
			return function(params,cb) {
				var res = statementfn(params);
				var key = Object.keys(res[0])[0];
				if(cb) cb(res[0][key]);
				return res[0][key];
			};
		} else  if(kind == 'single') {
			return function(params,cb) {
				var res = statementfn(params);
				if(cb) cb(res[0]);
				return res[0];
			}
		} else  if(kind == 'row') {
			return function(params,cb) {
				var res = statementfn(params,cb);
				var a = [];
				for(var key in res[0]) {
					a.push(res[0][key]);
				};
				if(cb) cb(a);
				return a;
			}
		} else  if(kind == 'column') {
			return function(params,cb) {
				var res = statementfn(params,cb);
				var ar = [];
				var key = Object.keys(res)[0];
				for(var i=0, ilen=res.length; i<ilen; i++){
					ar.push(res[i][key]);
				}
				if(cb) cb(ar);
				return ar;
			}
		} else if(kind == 'array') {
			return function(params,cb) {
				var res = statementfn(params,cb);
				res = flatArray(res);
				if(cb) cb(res);
				return res;
			};
		} else if(kind == 'matrix') {
			return function(params,cb) {
				var res = statementfn(params,cb);
				res = arrayOfArrays(res);
				if(cb) cb(res);
				return res;
			};				
		} else if(kind == 'collection') {
			return statementfn;
		} else {
			return statementfn;
		}
*/
	} else {
		throw new Error('Cannot compile, because number of statements in SQL is not equal to 1');
	}
};

// // Default methods to exec SQL statements
// alasql.run = alasql.exec = function (sql, params, cb) {
// 	return this.currentDatabase.exec(sql, params, cb);
// };

// Promised version of exec
// alasql.aexec = function (sql, params) {
// 	var self = this;
// 	return new Promise(function(resolve, reject){
// 		self.exec(sql,params,resolve);
// 	});
// };


/*
// MSSQL-Like aliases
alasql.query = function (sql, params, cb) {
	var res = this.exec(sql, params);
	if(cb) cb(res);
	return res;	
};

alasql.queryArray = function (sql, params, cb) {
	var res = flatArray(this.exec(sql, params));
	if(cb) cb(res);
	return res;
};

alasql.querySingle = function (sql, params, cb) {
	var res = this.exec(sql, params)[0];
	if(cb) cb(res);
	return res;
};

alasql.queryRow = function (sql, params, cb) {
	var res = this.querySingle(sql, params);
	var a = [];
	for(var key in res) {
		a.push(res[key]);
	};
	if(cb) cb(a);
	return a;
};

alasql.queryValue = function (sql, params, cb) {
	var res = this.exec(sql, params)[0];
	var val = res[Object.keys(res)[0]];
	if(cb) cb(val);
	return val;
	// TODO Refactor to query.columns
};

alasql.queryArrayOfArrays = function (sql, params, cb) {
	var res = this.exec(sql, params);
	var keys = Object.keys(res[0]);
	var klen = keys.length;
	var aa = [];
	for(var i=0, ilen=res.length;i<ilen;i++) {
		var r = res[i];
		var a = [];
		for(var k=0; k<klen;k++){
			a.push(r[keys[k]]);
		}
		aa.push(a);
	}

	if(cb) cb(aa);
	return aa;
};
*/
/*alasql.queryColumn = function (sql, params, cb) {
	var res = this.exec(sql, params);
	var keys = Object.keys(res[0]);
	var klen = keys.length;
	var aa = [];
	for(var i=0, ilen=res.length;i<ilen;i++) {
		var r = res[i];
		var a = [];
		for(var k=0; k<klen;k++){
			a.push(r[keys[k]]);
		}
		aa.push(a);
	}

	if(cb) cb(aa);
	return aa;
};
*/
/*
alasql.value = alasql.queryValue;
alasql.single = alasql.querySingle;
alasql.row = alasql.queryRow;
alasql.column = alasql.queryArray;
alasql.array = alasql.queryArray;
alasql.matrix = alasql.queryArrayOfArrays;
*/


//
// Promises for AlaSQL
//

if(typeof exports === 'object') {
	var Promise = require('es6-promise').Promise;
} 

//
// Only for browsers with Promise support
//

if(typeof Promise === 'function') {
	alasql.promise = function(sql, params) {
	    return new Promise(function(resolve, reject){
	        alasql(sql, params, function(data,err) {
	             if(err) {
	                 reject(err);
	             } else {
	                 resolve(data);
	             }
	        });
	    });
	};	
}

/*
//
// Database class for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

// Main Database class

/**
    @class Database 
 */

var Database = alasql.Database = function (databaseid) {
	var self = this;
//		self = function(a){console.log('OK',a);}
//		self.prototype = this;

	if(self === alasql) {
		if(databaseid) {
//			if(alasql.databases[databaseid]) {
				self = alasql.databases[databaseid];
//			} else {
				alasql.databases[databaseid] = self;
//			}
			if(!self) {
				throw new Error('Database "'+databaseid+'" not found');
			}
		} else {
			// Create new database (or get alasql?)
			self = alasql.databases.alasql;
			// For SQL Server examples, USE tempdb
			if(alasql.options.tsql){
				alasql.databases.tempdb = alasql.databases.alasql;
			}
//			self = new Database(databaseid); // to call without new
		}
	}
	if(!databaseid) {
		databaseid = "db"+(alasql.databasenum++); // Random name
	}
	self.databaseid = databaseid;
	alasql.databases[databaseid] = self;
	self.tables = {};
	self.views = {};

	// Objects storage
	self.objects = {};
	self.counter = 0;

	self.indices = {};
//	self.fn = {};
	self.resetSqlCache();
	self.dbversion = 0;
	return self;
};


/**
    Reset SQL statements cache
 */

Database.prototype.resetSqlCache = function () {
	this.sqlCache = {}; // Cache for compiled SQL statements
	this.sqlCacheSize = 0;	
}


// // Main SQL function

/**
    Run SQL statement on database
    @param {string} sql SQL statement
    @param [object] params Parameters
    @param {function} cb callback
 */

Database.prototype.exec = function(sql, params, cb) {
	return alasql.dexec(this.databaseid, sql, params, cb);
};



// 	// Compile
// 	var statement = this.compile(sql);
// 	// Run
// 	if(statement) {
// 		var data = statement(params, cb);
// 		return data;
// 	}
// 	return;
// };

// // Async version of exec


// Database.prototype.aexec = function(sql, params) {
// 	var self = this;
// 	return new Promise(function(resolve, reject){
// 		alasql.dexec(this.databaseid,sql,params,resolve);
// 	});
// };


// Aliases like MS SQL
/*
Database.prototype.query = Database.prototype.exec;
Database.prototype.run = Database.prototype.exec;
Database.prototype.queryArray = function(sql, params, cb) {
	return flatArray(this.exec(sql, params, cb));
}

Database.prototype.queryArrayOfArrays = function(sql, params, cb) {
	return arrayOfArrays(this.exec(sql, params, cb));
}

Database.prototype.querySingle = function(sql, params, cb) {
	return this.exec(sql, params, cb)[0];
}
Database.prototype.queryValue = function(sql, params, cb) {
	var res = this.querySingle(sql, params, cb);
	return res[Object.keys(res)[0]];
}

Database.prototype.value  = Database.prototype.queryValue;
Database.prototype.row    = Database.prototype.querySingle;
Database.prototype.array  = Database.prototype.queryArray;
Database.prototype.matrix = Database.prototype.queryArrayOfArrays;


// Compile statements
Database.prototype.compile = function(sql, kind) {
	return alasql.compile(sql, kind, databaseid);
};

*/
// 	var self = this;
// 	var hh = hash(sql);

// 	// Check cache with hash of SQL statement
// 	var statement = this.sqlcache[hh];
// 	if(!statement) {

// 		// If not fount, then compile it
// 		var ast = alasql.parse(sql);
// 		// Save to cache

// 		statement = this.sqlcache[hh]= ast.compile(self);

// 		// Memory leak prevention 
// 		this.sqlcachesize++;
// 		if(this.sqlcachesize > alasql.MAXSQLCACHESIZE) {
// 			this.resetSqlCache();
// 		}
// 	};
// 	return statement;
// }

// SQL.js compatibility method
//Database.prototype.prepare = Database.prototype.compile;


// Added for compatibility with WebSQL




/*
//
// Transactio class for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/


Database.prototype.transaction = function(cb) {
	var tx = new alasql.Transaction(this.databaseid);
	var res = cb(tx);
	return res;
};

// Transaction class (for WebSQL compatibility)

/** 
 Transaction class
 @class Transaction
 */

var Transaction = alasql.Transaction = function (databaseid) {
	this.transactionid = Date.now();
	this.databaseid = databaseid;
	this.commited = false; 
	this.dbversion = alasql.databases[databaseid].dbversion;
//	this.bank = cloneDeep(alasql.databases[databaseid]);
	this.bank = JSON.stringify(alasql.databases[databaseid]);
	// TODO CLone Tables with insertfns
//	console.log(this);
	return this;
};

// Main class 


// Commit

/**
 Commit transaction
 */
Transaction.prototype.commit = function() {
	this.commited = true;
	alasql.databases[this.databaseid].dbversion = Date.now();
	delete this.bank;
};

// Rollback
/**
 Rollback transaction
 */
Transaction.prototype.rollback = function() {
	if(!this.commited) {
		alasql.databases[this.databaseid] = JSON.parse(this.bank);
		// alasql.databases[this.databaseid].tables = this.bank;
		// alasql.databases[this.databaseid].dbversion = this.dbversion;
		delete this.bank;
	} else {
		throw new Error('Transaction already commited');
	}
};

// Transactions stub

/**
 Execute SQL statement
 @param {string} sql SQL statement
 @param {object} params Parameters
 @param {function} cb Callback function 
 @return result
 */
Transaction.prototype.exec = function(sql, params, cb) {
//	console.log(this.databaseid);
	return alasql.dexec(this.databaseid,sql,params,cb);
};

Transaction.prototype.executeSQL = Transaction.prototype.exec;

/*
Transaction.prototype.query = Database.prototype.exec;
Transaction.prototype.run = Database.prototype.exec;
Transaction.prototype.queryArray = function(sql, params, cb) {
	return flatArray(this.exec(sql, params, cb));
}

Transaction.prototype.queryArrayOfArrays = function(sql, params, cb) {
	return arrayOfArrays(this.exec(sql, params, cb));
}

Transaction.prototype.querySingle = function(sql, params, cb) {
	return this.exec(sql, params, cb)[0];
}
Transaction.prototype.queryValue = function(sql, params, cb) {
	var res = this.querySingle(sql, params, cb);
	return res[Object.keys(res)[0]];
}
*/

/*
//
// Table class for Alasql.js
// Date: 14.11.2014
// (c) 2014, Andrey Gershun
//
*/

// Table class
var Table = alasql.Table = function(params){

	// Columns
	this.columns = [];
	this.xcolumns = {};
	// Data array
	this.data = [];

	this.inddefs = {};
	this.indices = {};

	this.uniqs = {};
	this.uniqdefs = {};	

	extend(this,params);
};


// View = function(){
// 	this.data = [];
// 	this.columns = [];
// 	this.ixcolumns = {};
// 	this.ixdefs = {};
// 	this.indices = {};
// };

// alasql.View = View;

Table.prototype.indexColumns = function() {
	var self = this;
	self.xcolumns = {};
	self.columns.forEach(function(col){
		self.xcolumns[col.columnid] = col;
	});	
}



/*
//
// View class for Alasql.js
// Date: 14.11.2014
// (c) 2014, Andrey Gershun
//
*/

// Table class
var View = alasql.View = function(params){
	// Columns
	this.columns = [];
	this.xcolumns = {};
	// Data array
	this.query = [];

	extend(this,params);
};

// View = function(){
// 	this.data = [];
// 	this.columns = [];
// 	this.ixcolumns = {};
// 	this.ixdefs = {};
// 	this.indices = {};
// };

// alasql.View = View;



/*
//
// Query class for Alasql.js
// Date: 14.11.2014
// (c) 2014, Andrey Gershun
//
*/

// Table class

/**
 @class Query Main query class
 */
var Query = alasql.Query = function(params){
	this.alasql = alasql;
//	console.log(12,alasql);
	// Columns
	this.columns = [];
	this.xcolumns = {};
	this.selectGroup = [];
	this.groupColumns = {};
	// Data array
	extend(this,params);
};

/**
 @class Recordset data object
 */
var Recordset = alasql.Recordset = function(params){
	// Data array
	extend(this,params);
};


// View = function(){
// 	this.data = [];
// 	this.columns = [];
// 	this.ixcolumns = {};
// 	this.ixdefs = {};
// 	this.indices = {};
// };

// alasql.View = View;



/*
//
// Parser helper for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

var yy = parser.yy = alasql.yy = {};

// Utility
yy.extend = extend;
// Option for case sensitive
yy.casesensitive = alasql.options.casesensitive; 

// Base class for all yy classes
var Base = yy.Base = function (params) { return yy.extend(this, params); };

Base.prototype.toString = function() {}
Base.prototype.toType = function() {}
Base.prototype.toJS = function() {}

//var BaseClause = yy,BaseClause = function (params) { return yy.extend(this, params); };
Base.prototype.compile = returnUndefined;
Base.prototype.exec = function() {}

//var BaseStatement = yy,BaseStatement = function (params) { return yy.extend(this, params); };
Base.prototype.compile = returnUndefined;
Base.prototype.exec = function() {}




/*
//
// Statements class for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/


// Statements container
yy.Statements = function(params) { return yy.extend(this, params); };

yy.Statements.prototype.toString = function () {
	return this.statements.map(function(st){return st.toString()}).join('; ');
};

// Compile array of statements into single statement
yy.Statements.prototype.compile = function(db) {
	var statements = this.statements.map(function(st){
		return st.compile(db)
	});
	if(statements.length === 1) {
		return statements[0];	
	} else {
		return function(params, cb){
			var res = statements.map(function(st){ return st(params); });
			if(cb){
				cb(res);
			}
			return res;
		}
	}
};


/* global alasql */
/* global yy */
/*
//
// SEARCH for Alasql.js
// Date: 04.05.2015
// (c) 2015, Andrey Gershun
//
*/


function doSearch(databaseid, params, cb) {
	var res;
	var stope = {};
	var fromdata;
	var selectors = cloneDeep(this.selectors);



	function processSelector(selectors,sidx,value) {
//		var val;
/*		if(sidx == 0) {
			if(selectors.length > 0 && selectors[0].srchid == 'SHARP') {
				val = alasql.databases[alasql.useid].objects[selectors[0].args[0]];
				return processSelector(selectors,sidx+1,val);
				//selectors.shift();			
			} else if(selectors.length > 0 && selectors[0].srchid == 'AT') {
				val = alasql.vars[selectors[0].args[0]];
				return processSelector(selectors,sidx+1,val);
				//selectors.shift();
			} else if(selectors.length > 0 && selectors[0].srchid == 'CLASS') {
				val = alasql.databases[databaseid].tables[selectors[0].args[0]].data;
				return processSelector(selectors,sidx+1,val);
				//selectors.shift();
				//selectors.unshift({srchid:'CHILD'});
			} else {

			}
		}
*/
		var 
			val,	// temp values use many places
			nest, 	// temp value used many places
			r,		// temp value used many places
			sel = selectors[sidx];
//		console.log(sel);
//		if(!alasql.srch[sel.srchid]) {
//			throw new Error('Selector "'+sel.srchid+'" not found');
//		};
		
		var SECURITY_BREAK = 100000;

		if(sel.selid) {
			// TODO Process Selector
			if(sel.selid === 'PATH') {
				var queue = [{node:value,stack:[]}];
				var visited = {};
				//var path = [];
				var objects = alasql.databases[alasql.useid].objects;
				while (queue.length > 0) {
					var q = queue.shift()
					var node = q.node;
					var stack = q.stack;
					var r = processSelector(sel.args,0,node);
					if(r.length > 0) {
						if(sidx+1+1 > selectors.length) {
							return stack;
						} else {
							var rv = [];
							if(stack && stack.length > 0) {
								stack.forEach(function(stv){
									rv = rv.concat(processSelector(selectors,sidx+1,stv));
								});								
							}
							return rv;							
//							return processSelector(selectors,sidx+1,stack);
						}
					} else {
						if(typeof visited[node.$id] !== 'undefined') {
							continue;
						} else {
//							console.log(node.$id, node.$out);
							visited[node.$id] = true;
							if(node.$out && node.$out.length > 0) {
								node.$out.forEach(function(edgeid){
									var edge = objects[edgeid];
									var stack2 = stack.concat(edge);
									stack2.push(objects[edge.$out[0]]);
									queue.push({node:objects[edge.$out[0]],
										stack:stack2});
								});
							}
						}
					}
				}
				// Else return fail
				return [];
			} if(sel.selid === 'NOT') {
				var nest = processSelector(sel.args,0,value);
				//console.log(1,nest);
				if(nest.length>0) {
					return [];
				} else {
					if(sidx+1+1 > selectors.length) {
						return [value];
					} else {
						return processSelector(selectors,sidx+1,value);
					}
				}
			} else if(sel.selid === 'DISTINCT') {
				var nest;
				if(typeof sel.args === 'undefined' || sel.args.length === 0) {
					nest = distinctArray(value);
				} else {
					nest = processSelector(sel.args,0,value);
				}
				if(nest.length === 0) {
					return [];
				} else {
					var res = distinctArray(nest);
					if(sidx+1+1 > selectors.length) {
						return res;
					} else {
						return processSelector(selectors,sidx+1,res);
					}
				}
			} else if(sel.selid === 'AND') {
				var res = true;
				sel.args.forEach(function(se){
					res = res && (processSelector(se,0,value).length>0);
				});
				if(!res) {
					return [];
				} else {
					if(sidx+1+1 > selectors.length) {
						return [value];
					} else {
						return processSelector(selectors,sidx+1,value);
					}
				}
			} else if(sel.selid === 'OR') {
				var res = false;
				sel.args.forEach(function(se){
					res = res || (processSelector(se,0,value).length>0);
				});
				if(!res) {
					return [];
				} else {
					if(sidx+1+1 > selectors.length) {
						return [value];
					} else {
						return processSelector(selectors,sidx+1,value);
					}
				}
			} else if(sel.selid === 'ALL') {
				var nest = processSelector(sel.args[0],0,value);
				if(nest.length === 0) {
					return [];
				} else {
					if(sidx+1+1 > selectors.length) {
						return nest;
					} else {
						return processSelector(selectors,sidx+1,nest);
					}
				}
			} else if(sel.selid === 'ANY') {
				var nest = processSelector(sel.args[0],0,value);
//				console.log(272,nest);
				if(nest.length === 0) {
					return [];
				} else {
					if(sidx+1+1 > selectors.length) {
						return [nest[0]];
					} else {
						return processSelector(selectors,sidx+1,[nest[0]]);
					}
				}
			} else if(sel.selid === 'UNIONALL') {
				var nest = [];
				sel.args.forEach(function(se){
					nest = nest.concat(processSelector(se,0,value));
				});
				if(nest.length === 0) {
					return [];
				} else {
					if(sidx+1+1 > selectors.length) {
						return nest;
					} else {
						return processSelector(selectors,sidx+1,nest);
					}
				}
			} else if(sel.selid === 'UNION') {
				var nest = [];
				sel.args.forEach(function(se){
					nest = nest.concat(processSelector(se,0,value));
				});
				var nest = distinctArray(nest);
				if(nest.length === 0) {
					return [];
				} else {
					if(sidx+1+1 > selectors.length) {
						return nest;
					} else {
						return processSelector(selectors,sidx+1,nest);
					}
				}
			} else 	if(sel.selid === 'IF') {
				var nest = processSelector(sel.args,0,value);
				//console.log(1,nest);
				if(nest.length===0) {
					return [];
				} else {
					if(sidx+1+1 > selectors.length) {
						return [value];
					} else {
						return processSelector(selectors,sidx+1,value);
					}
				}
			} else 	if(sel.selid === 'REPEAT') {
//				console.log(352,sel.sels);
				var 
					lvar, 
					lmax,
					lmin = sel.args[0].value;
				if(!sel.args[1]) {
					lmax = lmin; // Add security break
				} else {
					lmax = sel.args[1].value;
				}
				if(sel.args[2]) {
					lvar = sel.args[2].variable;
				} 
				//var lsel = sel.sels;
//				console.log(351,lmin,lmax,lvar);

				var retval = [];

				if (lmin === 0) {
					if(sidx+1+1 > selectors.length) {
						retval = [value];
					} else {
						if(lvar){
							alasql.vars[lvar] = 0;
						}
						retval = retval.concat(processSelector(selectors,sidx+1,value));
					}
				}

//				console.log(364,retval);
//console.log(370,sel.sels);
					// var nests = processSelector(sel.sels,0,value).slice();
				if(lmax > 0) {
					var nests = [{value:value,lvl:1}];
						// if(lvl >= lmin) {
						// 	if(sidx+1+1 > selectors.length) {
						// 		retval = retval.concat(nests);
						// 	} else {
						// 		retval = retval.concat(processSelector(selectors,sidx+1,value));
						// 	}						
						// }
	//console.log(371,nests);
					var i = 0;
					while (nests.length > 0) {

						var nest = nests[0];
	//console.log(375,nest);
						nests.shift();
						if(nest.lvl <= lmax) {
							if(lvar){
								alasql.vars[lvar] = nest.lvl;
							}
//		console.log(394,sel.sels);
							var nest1 = processSelector(sel.sels,0,nest.value);
//						console.log(397,nest1);

							nest1.forEach(function(n){
								nests.push({value:n,lvl:nest.lvl+1});
							});
							if(nest.lvl >= lmin) {
								if(sidx+1+1 > selectors.length) {
									retval = retval.concat(nest1);
									//return nests;
								} else {
									nest1.forEach(function(n){
										retval = retval.concat(processSelector(selectors,sidx+1,n));
									});
								}
							}
						}
						// Security brake
						i++;
						if(i>SECURITY_BREAK) {
							throw new Error('Security brake. Number of iterations = '+i);
						}
					}

				}
				return retval;

			} else 	if(sel.selid ==='TO') {
//				console.log(347,value,sel.args[0]);
				var oldv = alasql.vars[sel.args[0]];
				var newv = [];
				if(oldv !== undefined) {
//					console.log(353,typeof oldv);
					newv = oldv.slice(0);
//					console.log(429, oldv, newv);
				} else {
					newv = [];
				}
				newv.push(value);
				// console.log(428,oldv,newv, value);
				// console.log(435,sidx+1+1,selectors.length);
//				console.log(355,alasql.vars[sel.args[0]]);
				if(sidx+1+1 > selectors.length) {
					return [value];
				} else {
					alasql.vars[sel.args[0]] = newv;
					var r1 = processSelector(selectors,sidx+1,value);
//					console.log('r1 =',r1);
					alasql.vars[sel.args[0]] = oldv;
					return r1;
				}
/*

alasql.srch.TO = function(val,args) {
  console.log(args[0]);

  alasql.vars[args[0]].push(val);
  return {status: 1, values: [val]};
};

*/
			} else if(sel.selid === 'ARRAY') {
				var nest = processSelector(sel.args,0,value);
				if(nest.length > 0) {
					val = nest;
				} else {
					return [];
				}
				if(sidx+1+1 > selectors.length) {
					return [val];
				} else {
					return processSelector(selectors,sidx+1,val);
				}
			} else if(sel.selid === 'SUM') {
				var nest = processSelector(sel.args,0,value);
				if(nest.length > 0) {
					var val = nest.reduce(function(sum, current) {
	  					return sum + current;
					}, 0);					
				} else {
					return [];
				}
				if(sidx+1+1 > selectors.length) {
					return [val];
				} else {
					return processSelector(selectors,sidx+1,val);
				}
			} else if(sel.selid === 'AVG') {
				nest = processSelector(sel.args,0,value);
				if(nest.length > 0) {
					val = nest.reduce(function(sum, current) {
	  					return sum + current;
					}, 0)/nest.length;
				} else {
					return [];
				}
				if(sidx+1+1 > selectors.length) {
					return [val];
				} else {
					return processSelector(selectors,sidx+1,val);
				}
			} else if(sel.selid === 'COUNT') {
				nest = processSelector(sel.args,0,value);
				if(nest.length > 0) {
					val = nest.length;
				} else {
					return [];
				}
				if(sidx+1+1 > selectors.length) {
					return [val];
				} else {
					return processSelector(selectors,sidx+1,val);
				}
			} else 	if(sel.selid === 'FIRST') {
				nest = processSelector(sel.args,0,value);
				if(nest.length > 0){
					val = nest[0];
				} else { 
					return [];
				}

				if(sidx+1+1 > selectors.length) {
					return [val];
				} else {
					return processSelector(selectors,sidx+1,val);
				}
			} else 	if(sel.selid === 'LAST') {
				nest = processSelector(sel.args,0,value);
				if(nest.length > 0) {
					val = nest[nest.length-1];
				} else {
					return [];
				}
				
				if(sidx+1+1 > selectors.length) {
					return [val];
				} else {
					return processSelector(selectors,sidx+1,val);
				}
			} else if(sel.selid === 'MIN') {
				nest = processSelector(sel.args,0,value);
				if(nest.length === 0){
					return [];
				}
				var val = nest.reduce(function(min, current) {
  					return Math.min(min,current);
				}, Infinity);
				if(sidx+1+1 > selectors.length) {
					return [val];
				} else {
					return processSelector(selectors,sidx+1,val);
				}
			} else 	if(sel.selid === 'MAX') {
				var nest = processSelector(sel.args,0,value);
				if(nest.length === 0){
					return [];
				}
				var val = nest.reduce(function(max, current) {
  					return Math.max(max,current);
				}, -Infinity);
				if(sidx+1+1 > selectors.length) {
					return [val];
				} else {
					return processSelector(selectors,sidx+1,val);
				}
			} else 	if(sel.selid === 'PLUS') {
				var retval = [];
//				retval = retval.concat(processSelector(selectors,sidx+1,n))
				var nests = processSelector(sel.args,0,value).slice();
				if(sidx+1+1 > selectors.length) {
					retval = retval.concat(nests);
				} else {
					nests.forEach(function(n){
						retval = retval.concat(processSelector(selectors,sidx+1,n));
					});
				}

				var i = 0;
				while (nests.length > 0) {
//					nest = nests[0];
//					nests.shift();
					var nest = nests.shift();
					
//					console.log(281,nest);
//					console.log(nest,nests);
					nest = processSelector(sel.args,0,nest);
//					console.log(284,nest);
//					console.log('nest',nest,'nests',nests);
					nests = nests.concat(nest);
//console.log(retval,nests);				

					if(sidx+1+1 > selectors.length) {
						retval = retval.concat(nest);
						//return retval;
					} else {
						nest.forEach(function(n){
//							console.log(293,n);
							var rn = processSelector(selectors,sidx+1,n);
//							console.log(294,rn, retval);
							retval = retval.concat(rn);
						});
					}

					// Security brake
					i++;
					if(i>SECURITY_BREAK) {
						throw new Error('Security brake. Number of iterations = '+i);
					}
				}
				return retval;
				//console.log(1,nest);
			} else 	if(sel.selid === 'STAR') {
				var retval = [];
				retval = processSelector(selectors,sidx+1,value);
				var nests = processSelector(sel.args,0,value).slice();
				if(sidx+1+1 > selectors.length) {
					retval = retval.concat(nests);
					//return nests;
				} else {
					nests.forEach(function(n){
						retval = retval.concat(processSelector(selectors,sidx+1,n));
					});
				}
				var i = 0;
				while (nests.length > 0) {
					var nest = nests[0];
					nests.shift();
//					console.log(nest,nests);
					nest = processSelector(sel.args,0,nest);
//					console.log('nest',nest,'nests',nests);
					nests = nests.concat(nest);

					if(sidx+1+1 <= selectors.length) {
						nest.forEach(function(n){
							retval = retval.concat(processSelector(selectors,sidx+1,n));
						});
					}

					// Security brake
					i++;
					if(i>SECURITY_BREAK) {
						throw new Error('Loop brake. Number of iterations = '+i);
					}
				}

				return retval;
			} else 	if(sel.selid === 'QUESTION') {
				var retval = [];
				retval = retval.concat(processSelector(selectors,sidx+1,value))
				var nest = processSelector(sel.args,0,value);
				if(sidx+1+1 <= selectors.length) {
					nest.forEach(function(n){
						retval = retval.concat(processSelector(selectors,sidx+1,n));
					});
				}
				return retval;
			} else if(sel.selid === 'WITH') {
				var nest = processSelector(sel.args,0,value);
//				console.log('WITH',nest);
				if(nest.length===0) {
					return [];
				} else {
					// if(sidx+1+1 > selectors.length) {
					// 	return [nest];
					// } else {
					// 	return processSelector(selectors,sidx+1,nest);
					// }
					var r = {status:1,values:nest};
				}
			} else if(sel.selid === 'ROOT') {
				if(sidx+1+1 > selectors.length) {
					return [value];
				} else {
					return processSelector(selectors,sidx+1,fromdata);
				}
			} else {
				throw new Error('Wrong selector '+sel.selid);
			}


		} else if(sel.srchid) {
			var r = alasql.srch[sel.srchid.toUpperCase()](value,sel.args,stope,params);
//			console.log(sel.srchid,r);
		} else {
			throw new Error('Selector not found');
		}
//		console.log(356,sidx,r);
		if(typeof r === 'undefined') {
			r = {status: 1, values: [value]};
		}

		var res = [];
		if(r.status === 1) {

			var arr = r.values;


			if(sidx+1+1 > selectors.length) {
//			if(sidx+1+1 > selectors.length) {
				res = arr;					
//				console.log('res',r)
			} else {
				for(var i=0;i<r.values.length;i++) {
					res = res.concat(processSelector(selectors,sidx+1,arr[i]));									
				}
			}
		}
		return res;
	}


	if(selectors !== undefined && selectors.length > 0) {

//			console.log(selectors[0].args[0].toUpperCase());
		if(selectors && selectors[0] && selectors[0].srchid === 'PROP' && selectors[0].args && selectors[0].args[0]) {
//			console.log(selectors[0].args[0]);
			if(selectors[0].args[0].toUpperCase() === 'XML') {
				stope.mode = 'XML';
				selectors.shift();
			} else if(selectors[0].args[0].toUpperCase() === 'HTML') {
				stope.mode = 'HTML';
				selectors.shift();
			} else if(selectors[0].args[0].toUpperCase() === 'JSON') {
				stope.mode = 'JSON';
				selectors.shift();
			}
		}
		if(selectors.length > 0 && selectors[0].srchid === 'VALUE') {
			stope.value = true;
			selectors.shift();
		}
	}

	
	if(this.from instanceof yy.Column) {
		var dbid = this.from.databaseid || databaseid;
		fromdata = alasql.databases[dbid].tables[this.from.columnid].data;
		//selectors.unshift({srchid:'CHILD'});
	} else if(
				this.from instanceof yy.FuncValue &&				 
				alasql.from[this.from.funcid.toUpperCase()]
			) {
		var args = this.from.args.map(function(arg){
		var as = arg.toJS();
//			console.log(as);
		var fn = new Function('params,alasql','var y;return '+as).bind(this);
		return fn(params,alasql);
		});
//		console.log(args);
		fromdata = alasql.from[this.from.funcid.toUpperCase()].apply(this,args);
//		console.log(92,fromdata);
	} else if(typeof this.from === 'undefined') {
		fromdata = alasql.databases[databaseid].objects;
	} else {
		var fromfn = new Function('params,alasql','var y;return '+this.from.toJS());
		fromdata = fromfn(params,alasql);			
		// Check for Mogo Collections
		if(
			typeof Mongo === 'object' && typeof Mongo.Collection !== 'object' && 
			fromdata instanceof Mongo.Collection
		) {
			fromdata = fromdata.find().fetch();
		}
//console.log(selectors,fromdata);
//		if(typeof fromdata == 'object' && fromdata instanceof Array) {
//			selectors.unshift({srchid:'CHILD'});					
//		}
	}
	
	// If source data is array than first step is to run over array
//	var selidx = 0;
//	var selvalue = fromdata;
	
	if(selectors !== undefined && selectors.length > 0) {
		// Init variables for TO() selectors

		if(false) {
			selectors.forEach(function(selector){
				if(selector.srchid === 'TO') {  //* @todo move to TO selector
					alasql.vars[selector.args[0]] = [];
					// TODO - process nested selectors
				}
			});
		}

		res = processSelector(selectors,0,fromdata);
	} else {
		res = fromdata; 	
	}
	
	if(this.into) {
		var a1,a2;
		if(typeof this.into.args[0] !== 'undefined') {
			a1 = 
				new Function('params,alasql','var y;return ' +
				this.into.args[0].toJS())(params,alasql);
		}
		if(typeof this.into.args[1] !== 'undefined') {
			a2 =  
				new Function('params,alasql','var y;return ' +
				this.into.args[1].toJS())(params,alasql);
		}
		res = alasql.into[this.into.funcid.toUpperCase()](a1,a2,res,[],cb);
	} else {
		if(stope.value && res.length > 0){
			res = res[0];
		}
		if (cb){
			res = cb(res);
		}
	}
	return res;
	
}


/**	
	Search class
	@class
	@example
	SEARCH SUM(/a) FROM ? -- search over parameter object
*/

yy.Search = function (params) { return yy.extend(this, params); }

yy.Search.prototype.toString = function () {
	var s = 'SEARCH' + ' ';
	if (this.selectors){
		s += this.selectors.toString();
	}
	if (this.from){
		s += 'FROM' + ' ' + this.from.toString();
	}
//console.log(s);
	return s;
};

yy.Search.prototype.toJS = function(context) {
//		console.log('yy.CreateVertex.toJS');
	var s = 'this.queriesfn['+(this.queriesidx-1)+'](this.params,null,'+context+')';
	// var s = '';
	return s;
};

yy.Search.prototype.compile = function(databaseid) {
	var dbid = databaseid;
	var self = this;

	var statement = function(params,cb){
				// console.log(31,self);
				// console.log(32,arguments);
		var res;
		doSearch.bind(self)(dbid,params,function(data){
			// console.log(35,data);
			res = modify(statement.query,data);
			// console.log(37,data);
			if(cb){
				res = cb(res);
			}
		});
			// console.log(39,res);
//		if(cb) res = cb(res);
		return res;
	};
	statement.query = {};
	return statement;
};


// List of search functions
alasql.srch = {};

alasql.srch.PROP = function(val,args,stope) {
//		console.log('PROP',args[0],val);
	if(stope.mode === 'XML') {
		var arr = [];
		val.children.forEach(function(v){
			if(v.name.toUpperCase() === args[0].toUpperCase()) {
				arr.push(v)
			}
		});
		if(arr.length>0) {
			return {status: 1, values: arr};
		} else {
			return {status: -1, values: []};
		}		
	} else {
		if(
			(typeof val !== 'object') 	|| 
			(val === null) 				|| 
			(typeof args !== 'object') 	|| 
			(typeof val[args[0]] === 'undefined')
		) {
			return {status: -1, values: []};
		} else {
			return {status: 1, values: [val[args[0]]]};
		}		
	}
};

alasql.srch.APROP = function(val, args) {
	if(
		(typeof val !== 'object') 	|| 
		(val === null)				||
		(typeof args !== 'object')	|| 
		(typeof val[args[0]] === 'undefined')) {
		return {status: 1, values: [undefined]};
	} else {
		return {status: 1, values: [val[args[0]]]};
	}		
};


// Test expression
alasql.srch.EQ = function(val,args,stope,params) {
  var exprs = args[0].toJS('x','');
  var exprfn = new Function('x,alasql,params','return '+exprs);
  if(val === exprfn(val,alasql,params)) {
    return {status: 1, values: [val]};
  } else {
    return {status: -1, values: []};        
  }
};

// Test expression
alasql.srch.LIKE = function(val,args,stope,params) {
  var exprs = args[0].toJS('x','');
  var exprfn = new Function('x,alasql,params','return '+exprs);
  if(val.toUpperCase().match(new RegExp('^'+exprfn(val,alasql,params).toUpperCase()
  	.replace(/%/g,'.*').replace(/\?|_/g,'.')+'$'),'g')) {
    return {status: 1, values: [val]};
  } else {
    return {status: -1, values: []};        
  }
};


alasql.srch.ATTR = function(val,args,stope) {
	if(stope.mode === 'XML') {
		if(typeof args === 'undefined') {
	      return {status: 1, values: [val.attributes]};
		} else {
			if(
				typeof val === 'object' 			&& 
				typeof val.attributes === 'object'	&&
				typeof val.attributes[args[0]] !== 'undefined'
			){
				return {status: 1, values: [val.attributes[args[0]]]};
			} else {
				return {status: -1, values: []};			
			}			
		}
	} else {
		throw new Error('ATTR is not using in usual mode');
	}
};

alasql.srch.CONTENT = function(val,args,stope) {
	if(stope.mode === 'XML') {
		return {status: 1, values: [val.content]};
	} else {
		throw new Error('ATTR is not using in usual mode');
	}
};

alasql.srch.SHARP = function(val,args) {
	var obj = alasql.databases[alasql.useid].objects[args[0]];
	if(typeof val !== 'undefined' && val === obj) {
		return {status: 1, values: [val]};
	} else {
		return {status: -1, values: []};
	}
};


alasql.srch.PARENT = function(/*val,args,stope*/) {
	// TODO: implement
	console.log('PARENT not implemented');
	return {status: -1, values: []};
};


alasql.srch.CHILD = function(val,args,stope) {
//    	console.log(641,val);
  if(typeof val === 'object') {
    if(val instanceof Array) {
      return {status: 1, values: val};
    } else {
    	if(stope.mode === 'XML') {
	      return {status: 1, values: Object.keys(val.children).map(function(key){return val.children[key];})};          
    	} else {
	      return {status: 1, values: Object.keys(val).map(function(key){return val[key];})};          
    	}
    }
  } else {
    // If primitive value
    return {status: 1, values:[]};
  }
};

// Return all keys
alasql.srch.KEYS = function(val) {
  if(typeof val === 'object' && val !== null) {
	  return {status: 1, values: Object.keys(val)};          
  } else {
    // If primitive value
    return {status: 1, values:[]};
  }
};

// Test expression
alasql.srch.WHERE = function(val,args) {
  var exprs = args[0].toJS('x','');
  var exprfn = new Function('x,alasql','return '+exprs);
  if(exprfn(val,alasql)) {
    return {status: 1, values: [val]};
  } else {
    return {status: -1, values: []};        
  }
};

alasql.srch.NAME = function(val,args) {
  if(val.name === args[0]) {
    return {status: 1, values: [val]};
  } else {
    return {status: -1, values: []};        
  }
};

alasql.srch.CLASS = function(val,args) {
//	console.log(val,args);
  // Please avoid `===` here
  if(val.$class == args) { 					// jshint ignore:line
    return {status: 1, values: [val]};
  } else {
    return {status: -1, values: []};        
  }
};


// Transform expression
alasql.srch.VERTEX = function(val) {
  if(val.$node === 'VERTEX') {
    return {status: 1, values: [val]};
  } else {
    return {status: -1, values: []};        
  }
};

// Transform expression
alasql.srch.INSTANCEOF = function(val,args) {
  if(val instanceof alasql.fn[args[0]]) {
    return {status: 1, values: [val]};
  } else {
    return {status: -1, values: []};        
  }
};


// Transform expression
alasql.srch.EDGE = function(val ) {
  if(val.$node === 'EDGE') {
    return {status: 1, values: [val]};
  } else {
    return {status: -1, values: []};        
  }
};

// Transform expression
alasql.srch.EX = function(val,args,stope,params) {
  var exprs = args[0].toJS('x','');
  var exprfn = new Function('x,alasql,params','return '+exprs);
  return {status: 1, values: [exprfn(val,alasql,params)]};
};


// Transform expression
alasql.srch.RETURN = function(val,args,stope,params) {
	var res = {};
	if(args && args.length > 0) {
		args.forEach(function(arg){
		  	var exprs = arg.toJS('x','');
  			var exprfn = new Function('x,alasql,params','return '+exprs);
  			if(typeof arg.as === 'undefined'){
  				arg.as = arg.toString();
  			}
  			res[arg.as] = exprfn(val,alasql,params);
		});
	}
  return {status: 1, values: [res]};
};


// Transform expression
alasql.srch.REF = function(val ) {
  return {status: 1, values: [alasql.databases[alasql.useid].objects[val]]};
};

// Transform expression
alasql.srch.OUT = function(val ) {
	if(val.$out && val.$out.length > 0) {
		var res = val.$out.map(function(v){ 
			return alasql.databases[alasql.useid].objects[v]
		}); 
		return {status: 1, values: res};
	} else {
		return {status: -1, values: []};
	}
};

// Transform expression
alasql.srch.IN = function(val) {
	if(val.$in && val.$in.length > 0) {
		var res = val.$in.map(function(v){ 
			return alasql.databases[alasql.useid].objects[v]
		}); 
		return {status: 1, values: res};
	} else {
		return {status: -1, values: []};
	}
};

// Transform expression
alasql.srch.AS = function(val,args) {
	alasql.vars[args[0]] = val;
  return {status: 1, values: [val]};
};

// Transform expression
alasql.srch.AT = function(val,args) {
	var v = alasql.vars[args[0]];
  return {status: 1, values: [v]};
};


// Transform expression
alasql.srch.CLONEDEEP = function(val) {
	// TODO something wrong
	var z = cloneDeep(val);
 	return {status: 1, values: [z]};
};

// // Transform expression
// alasql.srch.DELETE = function(val,args) {
// 	// TODO something wrong
// 	delete val;
//   return {status: 1, values: []};
// };


// Transform expression
alasql.srch.SET = function(val,args,stope,params) {
//	console.log(arguments);
	var s = args.map(function(st){
//console.log(898,st);		
		if(st.method === '@') {
			return 'alasql.vars[\''+st.variable+'\']='+st.expression.toJS('x','');
		} else if(st.method === '$') {
			return 'params[\''+st.variable+'\']='+st.expression.toJS('x','');
		} else {
			return 'x[\''+st.column.columnid+'\']='+st.expression.toJS('x','');
		}
	}).join(';');
	var setfn = new Function('x,params,alasql',s);
	
	setfn(val,params,alasql);

  return {status: 1, values: [val]};
};

alasql.srch.ROW = function(val,args,stope,params) {
  var s = 'var y;return [';
//  console.log(args[0]);
	s += args.map(function(arg){
		return arg.toJS('x','');
	}).join(',');
	s += ']'
	var setfn = new Function('x,params,alasql',s);
	var rv = setfn(val,params,alasql);

  return {status: 1, values: [rv]};
};


alasql.srch.D3 = function(val) {
	if(val.$node !== 'VERTEX' && val.$node === 'EDGE') {
		val.source = val.$in[0];
		val.target = val.$out[0];
	}

  	return {status: 1, values: [val]};
};


var compileSearchOrder = function (order) {
	if(order) {
//			console.log(990, this.order);
		if(
			order 				&& 
			order.length === 1 	&& 
			order[0].expression &&
			typeof order[0].expression === "function"
		){
//			console.log(991, this.order[0]);
			var func = order[0].expression;
//			console.log(994, func);
			return function(a,b){
				var ra = func(a),rb = func(b);
				if(ra>rb){
					return 1;
				}
				if(ra===rb){
					return 0;
				}
				return -1;
			}
		}

		var s = '';
		var sk = '';
		order.forEach(function(ord){
			// console.log(ord instanceof yy.Expression);
			// console.log(ord.toJS('a',''));
			// console.log(ord.expression instanceof yy.Column);
			
			// Date conversion
			var dg = ''; 
//console.log(ord.expression, ord.expression instanceof yy.NumValue);
			if(ord.expression instanceof yy.NumValue) {
				ord.expression = self.columns[ord.expression.value-1];
			}

			if(ord.expression instanceof yy.Column) {
				var columnid = ord.expression.columnid; 

				if(alasql.options.valueof){
					dg = '.valueOf()'; // TODO Check
				}
				// COLLATE NOCASE
				if(ord.nocase){
					dg += '.toUpperCase()';
				}

				if(columnid === '_') {
					s += 'if(a'+dg+(ord.direction === 'ASC'?'>':'<')+'b'+dg+')return 1;';
					s += 'if(a'+dg+'==b'+dg+'){';
				} else {
					s += 'if((a[\''+columnid+"']||'')"+dg+(ord.direction === 'ASC'?'>':'<')+'(b[\''+columnid+"']||'')"+dg+')return 1;';
					s += 'if((a[\''+columnid+"']||'')"+dg+'==(b[\''+columnid+"']||'')"+dg+'){';
				}

			} else {
				dg = '.valueOf()';
				// COLLATE NOCASE
				if(ord.nocase){
					dg += '.toUpperCase()';
				}
				s += 'if(('+ord.toJS('a','')+"||'')"+dg+(ord.direction === 'ASC'?'>(':'<(')+ord.toJS('b','')+"||'')"+dg+')return 1;';
				s += 'if(('+ord.toJS('a','')+"||'')"+dg+'==('+ord.toJS('b','')+"||'')"+dg+'){';
			}			

			// TODO Add date comparision
				// s += 'if(a[\''+columnid+"']"+dg+(ord.direction == 'ASC'?'>':'<')+'b[\''+columnid+"']"+dg+')return 1;';
				// s += 'if(a[\''+columnid+"']"+dg+'==b[\''+columnid+"']"+dg+'){';
//			}
			sk += '}';
		});
		s += 'return 0;';
		s += sk+'return -1';
//console.log(s);
		return new Function('a,b',s);
	}
};

alasql.srch.ORDERBY = function(val,args /*,stope*/) {
//	console.log(val);
	var res = val.sort(compileSearchOrder(args));
	return {status: 1, values: res};
};




// Main query procedure
function queryfn(query,oldscope,cb, A,B) {

//	console.log(query.queriesfn);

	var ms;
	query.sourceslen = query.sources.length;
	var slen = query.sourceslen;
	query.query = query; // TODO Remove to prevent memory leaks
	query.A = A;
	query.B = B;
//	console.log(arguments);
	query.cb = cb;
	query.oldscope = oldscope;

	// Run all subqueries before main statement
	if(query.queriesfn) {
		query.sourceslen += query.queriesfn.length;
		slen += query.queriesfn.length;

		query.queriesdata = [];

//		console.log(8);
		query.queriesfn.forEach(function(q,idx){
//			if(query.explain) ms = Date.now();
//console.log(18,idx);
//			var res = flatArray(q(query.params,null,queryfn2,(-idx-1),query));

//			var res = flatArray(queryfn(q.query,null,queryfn2,(-idx-1),query));
//			console.log(A,B);
// console.log(q);
			q.query.params = query.params;
//			query.queriesdata[idx] = 

	if(false) {
			queryfn(q.query,query.oldscope,queryfn2,(-idx-1),query);
	} else {
			queryfn2([],(-idx-1),query);
	}

//			console.log(27,q);


//			query.explaination.push({explid: query.explid++, description:'Query '+idx,ms:Date.now()-ms});
//			query.queriesdata[idx] = res;
//			return res;
		});
//		console.log(9,query.queriesdata.length);
//		console.log(query.queriesdata[0]);
	}

	var scope;
	if(!oldscope) scope = {};
	else scope = cloneDeep(oldscope);
	query.scope = scope;

	// First - refresh data sources

	var result;
	query.sources.forEach(function(source, idx){
//		source.data = query.database.tables[source.tableid].data;
//		console.log(666,idx);
		source.query = query;
		var rs = source.datafn(query, query.params, queryfn2, idx, alasql); 
//		console.log(333,rs);
		if(typeof rs !== undefined) {
			// TODO - this is a hack: check if result is array - check all cases and
			// make it more logical
			if((query.intofn || query.intoallfn) && rs instanceof Array) rs = rs.length;
			result = rs;
		}
//
// Ugly hack to use in query.wherefn and source.srcwherefns functions
// constructions like this.queriesdata['test'].
// I can elimite it with source.srcwherefn.bind(this)()
// but it may be slow.
// 
		source.queriesdata = query.queriesdata;  
	});
	if(0 === slen) 
		result = queryfn3(query);
	
	return result;
}

function queryfn2(data,idx,query) {
//console.log(56,arguments);
//		console.log(78,data, idx,query);
//console.trace();

	if(idx>=0) {
		var source = query.sources[idx];
		source.data = data;
		if(typeof source.data == 'function') {
			source.getfn = source.data;
			source.dontcache = source.getfn.dontcache;

	//			var prevsource = query.sources[h-1];
			if(source.joinmode == 'OUTER' || source.joinmode == 'RIGHT' || source.joinmode == 'ANTI') {
				source.dontcache = false;
			}
			source.data = {};
		}
	} else {
		// subqueries
//		console.log("queriesdata",data, flatArray(data));
		query.queriesdata[-idx-1] = flatArray(data);
//		console.log(98,query.queriesdata);
//		console.log(79,query.queriesdata);
	}

	query.sourceslen--;
	if(query.sourceslen>0) return;

	return queryfn3(query);
}

function queryfn3(query) {
//console.log(55,query);


	var scope = query.scope;
	// Preindexation of data sources
//	if(!oldscope) {
		preIndex(query);
//	}

	// query.sources.forEach(function(source) {
	// 		console.log(source.data);
	// });

	// Prepare variables
	query.data = [];
	query.xgroups = {};
	query.groups = [];

	// Level of Joins
	var h = 0;


	// Start walking over data
//console.log(142,'1111');
	doJoin(query, scope, h);
//console.log(144,'2222',query.modifier);

//console.log(85,query.data[0]);

	// If groupping, then filter groups with HAVING function
//			console.log(query.havingfns);
	if(query.groupfn) {
		query.data = [];
		if(0 === query.groups.length) {
			var g = {};
			if(query.selectGroup.length>0) {
//				console.log(query.selectGroup);
				query.selectGroup.forEach(function(sg){
					if(sg.aggregatorid == "COUNT" || sg.aggregatorid == "SUM") {
						g[sg.nick] = 0;
					} else {
						g[sg.nick] = undefined;
					}
				});
			}
			query.groups = [g];
//			console.log();
		}
		// 	console.log('EMPTY',query.groups);
		// 	debugger;
		// if(false && (query.groups.length == 1) && (Object.keys(query.groups[0]).length == 0)) {
		// 	console.log('EMPTY',query.groups);
		// } else {
			for(var i=0,ilen=query.groups.length;i<ilen;i++) {
	//			console.log(query.groups[i]);
				g = query.groups[i];
				if((!query.havingfn) || query.havingfn(g,query.params,alasql)) {
	//				console.log(g);
					var d = query.selectgfn(g,query.params,alasql);
					query.data.push(d);
				}
			};
		// }

//			query.groups = query.groups.filter();
	}
	// Remove distinct values	
	doDistinct(query);

	// UNION / UNION ALL
	if(query.unionallfn) {
// TODO Simplify this part of program
		var ud, nd;
		if(query.corresponding) {
			if(!query.unionallfn.query.modifier) query.unionallfn.query.modifier = undefined;
			ud = query.unionallfn(query.params);
		} else {
			if(!query.unionallfn.query.modifier) query.unionallfn.query.modifier = 'RECORDSET';
			nd = query.unionallfn(query.params);
			ud = [];
			ilen=nd.data.length
			for(var i=0;i<ilen;i++) {
				var r = {};
				for(var j=0,jlen=Math.min(query.columns.length,nd.columns.length);j<jlen;j++) {
					r[query.columns[j].columnid] = nd.data[i][nd.columns[j].columnid];
				}
				ud.push(r);
			}
		}
		query.data = query.data.concat(ud);
	} else if(query.unionfn) {

		if(query.corresponding) {
			if(!query.unionfn.query.modifier) query.unionfn.query.modifier = 'ARRAY';
			ud = query.unionfn(query.params);
		} else {
			if(!query.unionfn.query.modifier) query.unionfn.query.modifier = 'RECORDSET';
			nd = query.unionfn(query.params);
			ud = [];
			ilen=nd.data.length
			for(var i=0;i<ilen;i++) {
				r = {};
				jlen=Math.min(query.columns.length,nd.columns.length);
				for(var j=0;j<jlen;j++) {
					r[query.columns[j].columnid] = nd.data[i][nd.columns[j].columnid];
				}
				ud.push(r);
			}
		}

		query.data = arrayUnionDeep(query.data, ud);

	} else if(query.exceptfn) {
		if(query.corresponding) {
			if(!query.exceptfn.query.modifier) query.exceptfn.query.modifier = 'ARRAY';
			var ud = query.exceptfn(query.params);
		} else {
			if(!query.exceptfn.query.modifier) query.exceptfn.query.modifier = 'RECORDSET';
			var nd = query.exceptfn(query.params);
			var ud = [];
			for(var i=0,ilen=nd.data.length;i<ilen;i++) {
				var r = {};
				for(var j=0,jlen=Math.min(query.columns.length,nd.columns.length);j<jlen;j++) {
					r[query.columns[j].columnid] = nd.data[i][nd.columns[j].columnid];
				}
				ud.push(r);
			}
		}



		query.data = arrayExceptDeep(query.data, ud);
	} else if(query.intersectfn) {
		if(query.corresponding) {
			if(!query.intersectfn.query.modifier) 
				query.intersectfn.query.modifier = undefined;
			ud = query.intersectfn(query.params);
		} else {
			if(!query.intersectfn.query.modifier) 
				query.intersectfn.query.modifier = 'RECORDSET';
			nd = query.intersectfn(query.params);
			ud = [];
			ilen=nd.data.length;
			for(i=0;i<ilen;i++) {
				r = {};
				jlen=Math.min(query.columns.length,nd.columns.length);
				for(j=0;j<jlen;j++) {
					r[query.columns[j].columnid] = nd.data[i][nd.columns[j].columnid];
				}
				ud.push(r);
			}
		}


		query.data = arrayIntersectDeep(query.data, ud);
	}

	// Ordering
	if(query.orderfn) {
		if(query.explain) var ms = Date.now();
		query.data = query.data.sort(query.orderfn);
		if(query.explain) { 
			query.explaination.push({explid: query.explid++, description:'QUERY BY',ms:Date.now()-ms});
		}
	}

	// Reduce to limit and offset
	doLimit(query);

	// Remove Angular.js artifacts and other unnecessary columns
	// Issue #25

//	console.log('removeKeys:',query.removeKeys);

    // TODO: Check what artefacts rest from Angular.js
    if(typeof angular != "undefined") {
    	query.removeKeys.push('$$hashKey');
    }


	if(query.removeKeys.length > 0) {
	    var removeKeys = query.removeKeys;


	    // Remove from data
		jlen = removeKeys.length;
		if(jlen > 0) {
			ilen=query.data.length;	
			for(i=0;i<ilen;i++) {
				for(j=0; j<jlen;j++) {
					delete query.data[i][removeKeys[j]];
				}
			}    
		}

	    // Remove from columns list
		if(query.columns.length > 0) {
			query.columns = query.columns.filter(function(column){
				var found = false;
				removeKeys.forEach(function(key){
					if(column.columnid == key) found = true;
				});
				return !found;
			});
		}

	}

	if(typeof query.removeLikeKeys != 'undefined' && query.removeLikeKeys.length > 0) {

	    var removeLikeKeys = query.removeLikeKeys;

		// Remove unused columns
		// SELECT * REMOVE COLUMNS LIKE "%b"
		for(var i=0,ilen=query.data.length;i<ilen;i++) {
			r = query.data[i];
			for(var k in r) {
				for(j=0;j<query.removeLikeKeys.length;j++) {
					if(alasql.utils.like(query.removeLikeKeys[j],k)) {
//					if(k.match(query.removeLikeKeys[j])) {
						delete r[k];
					}				
				}
			} 
		}

		if(query.columns.length > 0) {
			query.columns = query.columns.filter(function(column){
				var found = false;
				removeLikeKeys.forEach(function(key){
//					if(column.columnid.match(key)) found = true;
					if(alasql.utils.like(key,column.columnid)) {
						found = true;
					}
				});
				return !found;
			});
		}

	}
//	console.log(query.intoallfns);

	// if(query.explain) {
	// 	if(query.cb) query.cb(query.explaination,query.A, query.B);
	// 	return query.explaination;
	// } else 
//console.log(190,query.intofns);
	if(query.intoallfn) {
//		console.log(161);
//		var res = query.intoallfn(query.columns,query.cb,query.A, query.B, alasql); 
		var res = query.intoallfn(query.columns,query.cb,query.params,query.alasql); 
//		console.log(1163,res);
//		if(query.cb) res = query.cb(res,query.A, query.B);
//		console.log(1165,res);
//		debugger;
		return res;	
	} else if(query.intofn) {
		ilen=query.data.length;
		for(i=0;i<ilen;i++){
			query.intofn(query.data[i],i,query.params,query.alasql);
		}
//		console.log(query.intofn);
		if(query.cb) 
			query.cb(query.data.length,query.A, query.B);
		return query.data.length;
	} else {
//		console.log(111,query.cb,query.data);
		res = query.data;
		if(query.cb) 
			res = query.cb(query.data,query.A, query.B);
//		console.log(777,res)
		return res;
	}

}

// Limiting
function doLimit (query) {
//	console.log(query.limit, query.offset)
	if(query.limit) {
		var offset = 0;
		if(query.offset) offset = ((query.offset|0)-1)||0;
		var limit;
		if(query.percent) {
			limit = ((query.data.length*query.limit/100)| 0)+offset;			
		} else {
			limit = (query.limit|0) + offset;
		}
		query.data = query.data.slice(offset,limit);
	}
}

// Distinct
function doDistinct (query) {
	if(query.distinct) {
		var uniq = {};
		// TODO: Speedup, because Object.keys is slow
		// TODO: Problem with DISTINCT on objects
		for(var i=0,ilen=query.data.length;i<ilen;i++) {
			var uix = Object.keys(query.data[i]).map(function(k){return query.data[i][k];}).join('`');
			uniq[uix] = query.data[i];
		}
		query.data = [];
		for(var key in uniq) query.data.push(uniq[key]);
	}
}


// Optimization: preliminary indexation of joins
preIndex = function(query) {
//	console.log(query);
	// Loop over all sources
	// Todo: make this loop smaller and more graspable
	for(var k=0, klen = query.sources.length;k<klen;k++) {
		var source = query.sources[k];
		delete source.ix;
		// If there is indexation rule
//console.log('preIndex', source);
//console.log(source);
		if(k > 0 && source.optimization == 'ix' && source.onleftfn && source.onrightfn) {
			// If there is no table.indices - create it
			if(source.databaseid && alasql.databases[source.databaseid].tables[source.tableid]) {
				if(!alasql.databases[source.databaseid].tables[source.tableid].indices) query.database.tables[source.tableid].indices = {};
					// Check if index already exists
				var ixx = alasql.databases[source.databaseid].tables[source.tableid].indices[hash(source.onrightfns+'`'+source.srcwherefns)];
				if( !alasql.databases[source.databaseid].tables[source.tableid].dirty && ixx) {
					source.ix = ixx; 
				}
			}

			if(!source.ix) {
				source.ix = {};
				// Walking over source data
				var scope = {};
				var i = 0;
				var ilen = source.data.length;
				var dataw;
//				while(source.getfn i<ilen) {

				while((dataw = source.data[i]) || (source.getfn && (dataw = source.getfn(i))) || (i<ilen)) {
					if(source.getfn && !source.dontcache) source.data[i] = dataw;
//					scope[tableid] = dataw;

//				for(var i=0, ilen=source.data.length; i<ilen; i++) {
					// Prepare scope for indexation
					scope[source.alias || source.tableid] = dataw;

					// Check if it apply to where function 
					if(source.srcwherefn(scope, query.params, alasql)) {
						// Create index entry for each address
						var addr = source.onrightfn(scope, query.params, alasql);
						var group = source.ix [addr]; 
						if(!group) {
							group = source.ix [addr] = []; 
						}
						group.push(dataw);
					}
					i++;
				}

				if(source.databaseid && alasql.databases[source.databaseid].tables[source.tableid]){
					// Save index to original table				
					alasql.databases[source.databaseid].tables[source.tableid].indices[hash(source.onrightfns+'`'+source.srcwherefns)] = source.ix;
				}
			}
//console.log(38,274,source.ix);

			// Optimization for WHERE column = expression
		} else if (source.wxleftfn) {
				if(!alasql.databases[source.databaseid].engineid) {
					// Check if index exists
					ixx = alasql.databases[source.databaseid].tables[source.tableid].indices[hash(source.wxleftfns+'`')];
				}
				if( !alasql.databases[source.databaseid].tables[source.tableid].dirty && ixx) {
					// Use old index if exists
					source.ix = ixx;
					// Reduce data (apply filter)
					source.data = source.ix[source.wxrightfn(null, query.params, alasql)]; 
				} else {
					// Create new index
					source.ix = {};
					// Prepare scope
					scope = {};
					// Walking on each source line
					i = 0;
					ilen = source.data.length;
					dataw;
	//				while(source.getfn i<ilen) {

					while((dataw = source.data[i]) || (source.getfn && (dataw = source.getfn(i))) || (i<ilen)) {
						if(source.getfn && !source.dontcache) 
							source.data[i] = dataw;
	//					for(var i=0, ilen=source.data.length; i<ilen; i++) {
						scope[source.alias || source.tableid] = source.data[i];
						// Create index entry
						addr = source.wxleftfn(scope, query.params, alasql);
						group = source.ix[addr]; 
						if(!group) {
							group = source.ix[addr] = []; 
						}
						group.push(source.data[i]);
						i++;
					}
	//					query.database.tables[source.tableid].indices[hash(source.wxleftfns+'`'+source.onwherefns)] = source.ix;
					if(!alasql.databases[source.databaseid].engineid) {
						alasql.databases[source.databaseid].tables[source.tableid].indices[hash(source.wxleftfns+'`')] = source.ix;
					}
				}
				// Apply where filter to reduces rows
				if(source.srcwherefns) {
					if(source.data) {
						scope = {};
						source.data = source.data.filter(function(r) {
							scope[source.alias] = r;
							return source.srcwherefn(scope, query.params, alasql);
						});
					} else {
						source.data = [];
					}
				}		
//			}
		// If there is no any optimization than apply srcwhere filter
		} else if(source.srcwherefns && !source.dontcache) {
			if(source.data) {
				var scope = {};
				// TODO!!!!! Data as Function

				source.data = source.data.filter(function(r) {
					scope[source.alias] = r;
//					console.log(288,source);
					return source.srcwherefn(scope, query.params, alasql);
				});

				scope = {};
				i = 0;
				ilen = source.data.length;
				//var dataw;
				var res = [];
//				while(source.getfn i<ilen) {

				while((dataw = source.data[i]) || (source.getfn && (dataw = source.getfn(i))) || (i<ilen)) {
					if(source.getfn && !source.dontcache) source.data[i] = dataw;
					scope[source.alias] = dataw;
					if(source.srcwherefn(scope, query.params, alasql)) res.push(dataw);
					i++;
				}
				source.data = res;

			} else {
				source.data = [];
			}
		}			
		// Change this to another place (this is a wrong)
		if(source.databaseid && alasql.databases[source.databaseid].tables[source.tableid]) {
			//query.database.tables[source.tableid].dirty = false;
		} else {
			// this is a subquery?
		}
	}
};


//
// Join all lines over sources 
//

function doJoin (query, scope, h) {
//	console.log('doJoin', arguments);
//	console.log(query.sources.length);
	// Check, if this is a last join?
	if(h>=query.sources.length) {
//console.log(query.wherefns);
		// Then apply where and select
//		console.log(query);
		if(query.wherefn(scope,query.params, alasql)) {

//			console.log("scope",scope.schools);

//			var res = query.selectfn(scope, query.params, alasql);
//			console.log("last",res);
			// If there is a GROUP BY then pipe to groupping function
			if(query.groupfn) {
				query.groupfn(scope, query.params, alasql)
			} else {
//				query.qwerty = 999;
//console.log(query.qwerty, query.queriesfn && query.queriesfn.length,2);
				query.data.push(query.selectfn(scope, query.params, alasql));
			}	
		}
	} else if(query.sources[h].applyselect) {
//		console.log('APPLY',scope);
//			console.log('scope1',scope);
//				console.log(scope);
		var source = query.sources[h];
		source.applyselect(query.params, function(data){
			if(data.length > 0) {
	//			console.log('APPLY CB');
				for(var i=0;i<data.length;i++) {
					scope[source.alias] = data[i];
					doJoin(query, scope, h+1);
				};			
			} else {
//				console.log(source.applymode);
				if (source.applymode == 'OUTER') {
					scope[source.alias] = {};
					doJoin(query, scope, h+1);
				}
			}
		},scope);

//		console.log(data);
	} else {

// STEP 1

		var source = query.sources[h];
		var nextsource = query.sources[h+1];

//		if(source.joinmode == "LEFT" || source.joinmode == "INNER" || source.joinmode == "RIGHT"
//			|| source.joinmode == "OUTER" || source.joinmode == "SEMI") {
		if(true) {//source.joinmode != "ANTI") {

			// if(nextsource && nextsource.joinmode == "RIGHT") {
			// 	if(!nextsource.rightdata) {
			// 		console.log("ok");
			// 		nextsource.rightdata = new Array(nextsource.data.length);
			// 		console.log(nextsource.data.length, nextsource.rightdata);
			// 	}
			// }

			var tableid = source.alias || source.tableid; 
			var pass = false; // For LEFT JOIN
			var data = source.data;
			var opt = false;

			// Reduce data for looping if there is optimization hint
			if(!source.getfn || (source.getfn && !source.dontcache)) {
				if(source.joinmode != "RIGHT" && source.joinmode != "OUTER" && source.joinmode != "ANTI" && source.optimization == 'ix') {
					data = source.ix[ source.onleftfn(scope, query.params, alasql) ] || [];
					opt = true;
//					console.log(source.onleftfns);
//					console.log(source.ix);
//	console.log(source.onleftfn(scope, query.params, alasql));
//					console.log(opt, data, data.length);
				}
			}

			// Main cycle
			var i = 0;
			if(typeof data == 'undefined') {
				throw new Error('Data source number '+h+' in undefined')
			}
			var ilen=data.length;
			var dataw;
//			console.log(h,opt,source.data,i,source.dontcache);
			while((dataw = data[i]) || (!opt && (source.getfn && (dataw = source.getfn(i)))) || (i<ilen) ) {
				if(!opt && source.getfn && !source.dontcache) data[i] = dataw;
//console.log(h, i, dataw);
				scope[tableid] = dataw;
				// Reduce with ON and USING clause
				if(!source.onleftfn || (source.onleftfn(scope, query.params, alasql) == source.onrightfn(scope, query.params, alasql))) {
					// For all non-standard JOINs like a-b=0
					if(source.onmiddlefn(scope, query.params, alasql)) {
						// Recursively call new join
//						if(source.joinmode == "LEFT" || source.joinmode == "INNER" || source.joinmode == "OUTER" || source.joinmode == "RIGHT" ) {
						if(source.joinmode != "SEMI" && source.joinmode != "ANTI") { 
//							console.log(scope);
							doJoin(query, scope, h+1);
						}

						// if(source.data[i].f = 200) debugger;

//						if(source.joinmode == "RIGHT" || source.joinmode == "ANTI" || source.joinmode == "OUTER") {
						if(source.joinmode != "LEFT" && source.joinmode != "INNER") {
							dataw._rightjoin = true;
						}

						// for LEFT JOIN
						pass = true;
					}
				};
				i++;
			};


			// Additional join for LEFT JOINS
			if((source.joinmode == 'LEFT' || source.joinmode == 'OUTER' || source.joinmode == 'SEMI' ) && !pass) {
			// Clear the scope after the loop
				scope[tableid] = {};
				doJoin(query,scope,h+1);
			}	


		}

		// When there is no records
//		if(data.length == 0 && query.groupfn) {
//			scope[tableid] = undefined;
//			doJoin(query,scope,h+1);
//		}

// STEP 2

		if(h+1 < query.sources.length) {

			if(nextsource.joinmode == "OUTER" || nextsource.joinmode == "RIGHT" 
				|| nextsource.joinmode == "ANTI") {


				scope[source.alias] = {};
			
				var j = 0;
				var jlen = nextsource.data.length;
				var dataw;

				while((dataw = nextsource.data[j]) || (nextsource.getfn && (dataw = nextsource.getfn(j))) || (j<jlen)) {
					if(nextsource.getfn && !nextsource.dontcache) nextsource.data[j] = dataw;

					if(!dataw._rightjoin) {
						scope[nextsource.alias] = dataw;
						doJoin(query, scope, h+2);
					} else {
						//dataw._rightjoin = undefined;	
						delete dataw._rightjoin;					
					}
					j++;
				}
//				console.table(nextsource.data);
//				debugger;	

			};
		};


		scope[tableid] = undefined;

/*
		if(h+1 < query.sources.length) {
			var nextsource = query.sources[h+1];

			if(nextsource.joinmode == "OUTER" || nextsource.joinmode == "RIGHT" 
				|| nextsource.joinmode == "ANTI") {


				console.log(h,query.sources.length);
				// Swap


//				swapSources(query,h);

//				console.log(query.sources);
				//debugger;
//				var source = query.sources[h];

//				var tableid = source.alias || source.tableid; 
//				var data = source.data;

				// Reduce data for looping if there is optimization hint
//				if(source.optimization == 'ix') {
//					data = source.ix[ source.onleftfn(scope, query.params, alasql) ] || [];
//				}

				// Main cycle
				var pass = false;
//				console.log(tableid, data.length);
				for(var i=0, ilen=nextsource.data.length; i<ilen; i++) {
					scope[nextsource.tableid] = nextsource.data[i];
					// Reduce with ON and USING clause
					if(!source.onleftfn || (source.onleftfn(scope, query.params, alasql) == source.onrightfn(scope, query.params, alasql))) {
						// For all non-standard JOINs like a-b=0
						if(source.onmiddlefn(scope, query.params, alasql)) {
							// Recursively call new join
//							if(source.joinmode == "OUTER") {
								doJoin(query, scope, h+2);
//							}
							// for LEFT JOIN
							pass = true;
						}
					};
					if(!pass) {
					// Clear the scope after the loop
//						scope[tableid] = {};
						console.log(scope);
						doJoin(query,scope,h+2);
					}	
				};

				// Additional join for LEFT JOINS
					scope[query.sources[h+1].tableid] = {};
					console.log(scope);

				scope[tableid] = undefined;

				// SWAP BACK
				swapSources(query,h);

			}
		}

*/
	}

};

function swapSources(query, h) {
	var source = query.sources[h];
	var nextsource = query.sources[h+1];

	var onleftfn = source.onleftfn;
	var onleftfns = source.onleftfns;
	var onrightfn = source.onrightfn;
	var onrightfns = source.onrightfns;
	var optimization = source.optimization;

	source.onleftfn = nextsource.onrightfn;
	source.onleftfns = nextsource.onrightfns;
	source.onrightfn = nextsource.onleftfn;
	source.onrightfns = nextsource.onleftfns;
	source.optimization = nextsource.optimization;

	nextsource.onleftfn = onleftfn;
	nextsource.onleftfns = onleftfns;
	nextsource.onrightfn = onrightfn;
	nextsource.onrightfns = onrightfns;
	nextsource.optimization = optimization;

	query.sources[h] = nextsource;
	query.sources[h+1] = source;
}


/*
//
// Select run-time part for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

//
// Main part of SELECT procedure
//

yy.Select = function (params) { return yy.extend(this, params); }
yy.Select.prototype.toString = function() {
	var s = '';
	if(this.explain){
		s+= 'EXPLAIN ';
	}
	s += 'SELECT ';
	if(this.modifier){
		s += this.modifier+' ';
	}
	if(this.top) {
		s += 'TOP '+this.top.value+' ';
		if(this.percent){
			s += 'PERCENT ';
		}
	}
	s += this.columns.map(function(col){
		var s = col.toString();
//		console.log(col);
		if(typeof col.as !== "undefined"){
			s += ' AS '+col.as;
		}
		return s;
	}).join(', ');

	if(this.from) {
		s += 	' FROM '
				+ this.from.map(function(f){
									//			console.log(f);
												var ss = f.toString();
												if(f.as){
													ss += ' AS '+f.as;
												}
												return ss;
											}).join(',');
										}

	if(this.joins) {
		s += this.joins.map(function(jn){
			var ss = ' ';
			if(jn.joinmode){
				ss += jn.joinmode+' ';
			}
			
			if(jn.table){
				ss += 'JOIN '+jn.table.toString();
			} else if(jn instanceof yy.Apply){
				ss += jn.toString();
			} else {
				throw new Error('Wrong type in JOIN mode');
			}

			if(jn.using){
				ss += ' USING '+jn.using.toString();
			}

			if(jn.on){
				ss += ' ON '+jn.on.toString();
			}
			return ss;
 		});
	}

	if(this.where){
		s += ' WHERE '+this.where.toString();
	}
	if(this.group && this.group.length>0) {
		s += ' GROUP BY ' + this.group.map(function(grp){
															return grp.toString();
														}).join(', ');
	}

	if(this.having){
		s += ' HAVING '+this.having.toString();
	}

	if(this.order && this.order.length>0) {
		s += ' ORDER BY '+this.order.map(function(ord){
														return  ord.toString();
													}).join(', ');
	}

	if(this.limit){
		s += ' LIMIT '+this.limit.value;
	}

	if(this.offset){
		s += ' OFFSET '+this.offset.value;
	}

	if(this.union){
		s += ' UNION '
			+ (this.corresponding ? 'CORRESPONDING ' : '')
			+ this.union.toString();
	}

	if(this.unionall){
		s += ' UNION ALL '
			+ (this.corresponding ? 'CORRESPONDING ' : '')
			+ this.unionall.toString();
	}

	if(this.except){
		s += ' EXCEPT '
			+ (this.corresponding ? 'CORRESPONDING ' : '')
			+ this.except.toString();
	}

	if(this.intersect){
		s += ' INTERSECT '
			+ (this.corresponding ? 'CORRESPONDING ' : '')
			+ this.intersect.toString();
	}

	return s;
};

/**
 Select statement in expression
 */
yy.Select.prototype.toJS = function(context) {
//	console.log('Expression',this);
//	if(this.expression.reduced) return 'true';
//	return this.expression.toJS(context, tableid, defcols);
// console.log('Select.toJS', 81, this.queriesidx);
//	var s = 'this.queriesdata['+(this.queriesidx-1)+'][0]';

	var s = 'alasql.utils.flatArray(this.queriesfn['+(this.queriesidx-1)+'](this.params,null,'+context+'))[0]';


//	var s = '(ee=alasql.utils.flatArray(this.queriesfn['+(this.queriesidx-1)+'](this.params,null,'+context+')),console.log(999,ee),ee[0])';

	return s;
};


// Compile SELECT statement
yy.Select.prototype.compile = function(databaseid) {
	var db = alasql.databases[databaseid];
	// Create variable for query
	var query = new Query();

	// Array with columns to be removed
    query.removeKeys = [];

	query.explain = this.explain; // Explain
	query.explaination = [];
	query.explid = 1;
//console.log(this.modifier);
	query.modifier = this.modifier;
	
	query.database = db;
	// 0. Precompile whereexists
	this.compileWhereExists(query);

	// 0. Precompile queries for IN, NOT IN, ANY and ALL operators
	this.compileQueries(query);
	
	query.defcols = this.compileDefCols(query, databaseid);

	// 1. Compile FROM clause
	query.fromfn = this.compileFrom(query);
	
	// 2. Compile JOIN clauses
	if(this.joins){
		this.compileJoins(query);
	}

	// todo?: 3. Compile SELECT clause

	// For ROWNUM()
	query.rownums = [];
	
	this.compileSelectGroup0(query);

	if(this.group || query.selectGroup.length>0) {
		query.selectgfns = this.compileSelectGroup1(query);
	} else {
		query.selectfns = this.compileSelect1(query);
	}

	// Remove columns clause
	this.compileRemoveColumns(query);

	// 5. Optimize WHERE and JOINS
	if(this.where){
		this.compileWhereJoins(query);
	}

	// 4. Compile WHERE clause
	query.wherefn = this.compileWhere(query);


	// 6. Compile GROUP BY
	if(this.group || query.selectGroup.length>0){
		query.groupfn = this.compileGroup(query);
	}

	// 6. Compile HAVING
	if(this.having){
		query.havingfn = this.compileHaving(query);
	}


	if(this.group || query.selectGroup.length>0) {
		query.selectgfn = this.compileSelectGroup2(query);
	} else {
		query.selectfn = this.compileSelect2(query);
	}


	// 7. Compile DISTINCT, LIMIT and OFFSET
	query.distinct = this.distinct;

	// 8. Compile ORDER BY clause
	if(this.order){
		query.orderfn = this.compileOrder(query);
	}

	// 9. Compile PIVOT clause
	if(this.pivot) query.pivotfn = this.compilePivot(query);
	if(this.unpivot) query.pivotfn = this.compileUnpivot(query);

	// 10. Compile TOP/LIMIT/OFFSET/FETCH cleuse
	if(this.top) {
		query.limit = this.top.value;
	} else if(this.limit) {
		query.limit = this.limit.value;
		if(this.offset) {
			query.offset = this.offset.value;
		}
	}

	query.percent = this.percent;

	// 9. Compile ordering function for UNION and UNIONALL
	query.corresponding = this.corresponding; // If CORRESPONDING flag exists
	if(this.union) {
		query.unionfn = this.union.compile(databaseid);
		if(this.union.order) {
			query.orderfn = this.union.compileOrder(query);
		} else {
			query.orderfn = null;
		}
	} else if(this.unionall) {
		query.unionallfn = this.unionall.compile(databaseid);
		if(this.unionall.order) {
			query.orderfn = this.unionall.compileOrder(query);
		} else {
			query.orderfn = null;
		}
	} else if(this.except) {
		query.exceptfn = this.except.compile(databaseid);
		if(this.except.order) {
			query.orderfn = this.except.compileOrder(query);
		} else {
			query.orderfn = null;
		}
	} else if(this.intersect) {
		query.intersectfn = this.intersect.compile(databaseid);
		if(this.intersect.order) {
			query.intersectfn = this.intersect.compileOrder(query);
		} else {
			query.orderfn = null;
		}
	}

	// SELECT INTO
	if(this.into) {
		if(this.into instanceof yy.Table) {
			//
			// Save into the table in database
			//
			if(alasql.options.autocommit && alasql.databases[this.into.databaseid||databaseid].engineid) {
				// For external database when AUTOCOMMIT is ONs
				query.intoallfns = 'return alasql.engines["'+alasql.databases[this.into.databaseid||databaseid].engineid+'"]'+
					'.intoTable("'+(this.into.databaseid||databaseid)+'","'+this.into.tableid+'",this.data, columns, cb);';
			} else {
				// Into AlaSQL tables
				query.intofns = 
				'alasql.databases[\''+(this.into.databaseid||databaseid)+'\'].tables'+
				'[\''+this.into.tableid+'\'].data.push(r);';
			}
		} else if(this.into instanceof yy.VarValue) {
			//
			// Save into local variable
			// SELECT * INTO @VAR1 FROM ?
			//
			query.intoallfns = 'alasql.vars["'+this.into.variable+'"]=this.data;res=this.data.length;if(cb)res=cb(res);return res;';
		} else if (this.into instanceof yy.FuncValue) {
			//
			// If this is INTO() function, then call it
			// with one or two parameters
			//
			var qs = 'return alasql.into[\''+this.into.funcid.toUpperCase()+'\'](';
			if(this.into.args && this.into.args.length>0 ) {
				qs += this.into.args[0].toJS()+',';
				if(this.into.args.length > 1) {
					qs += this.into.args[1].toJS()+',';
				} else {
					qs += 'undefined,';
				}
			} else {
				qs += 'undefined, undefined,'
			}
			query.intoallfns = qs+'this.data,columns,cb)';
//console.log('999');		


		} else if (this.into instanceof yy.ParamValue) {
			//
			// Save data into parameters array
			// like alasql('SELECT * INTO ? FROM ?',[outdata,srcdata]);
			//
			query.intofns = "params['"+this.into.param+"'].push(r)";
		}

		if(query.intofns) {
			// Create intofn function
			query.intofn = new Function("r,i,params,alasql",'var y;'+query.intofns); 
		} else if(query.intoallfns) {
			// Create intoallfn function
			query.intoallfn = new Function("columns,cb,params,alasql",'var y;'+query.intoallfns); 
		}

	}
//console.log(query);

	// Now, compile all togeather into one function with query object in scope
	var statement = function(params, cb, oldscope) {
		query.params = params;
		var res1 = queryfn(query,oldscope,function(res){

//console.log(res[0].schoolid);
//console.log(184,res);
			if(query.rownums.length>0) {
				for(var i=0,ilen=res.length;i<ilen;i++) {
					for(var j=0,jlen=query.rownums.length;j<jlen;j++) {
						res[i][query.rownums[j]] = i+1;
					}
				}
			}

			var res2 = modify(query, res);


			if(cb){
				cb(res2);
			}
//console.log(8888,res2);
			return res2;

		}); 
//console.log(9999,res1);

//		if(typeof res1 != 'undefined') res1 =  modify(query,res1);

		return res1;
		
	};

//	statement.dbversion = ;
//	console.log(statement.query);
//console.log(202,statement);
	statement.query = query;
	return statement;
};

/**
	Modify res according modifier
	@function
	@param {object} query Query object
	@param res {object|number|string|boolean} res Data to be converted 
*/
function modify(query, res) { // jshint ignore:line
//	console.log(arguments);

	/* If source is a primitive value then return it */
	if(		typeof res === 'undefined' 
		|| 	typeof res === 'number' 
		|| 	typeof res === 'string' 
		|| 	typeof res == 'boolean'
	){
		return res;
	}

	var modifier = query.modifier || alasql.options.modifier;
	var columns = query.columns;
	if(typeof columns === 'undefined' || columns.length == 0) {
		// Try to create columns
		if(res.length > 0) {
			var allcol = {};
			for(var i=0;i<Math.min(res.length,alasql.options.columnlookup||10);i++) {
				for(var key in res[i]) {
					allcol[key] = true;
				}
			}

			columns = Object.keys(allcol).map(function(columnid){
				return {columnid:columnid};
			});			
		} else {
			// Cannot recognize columns
			columns = [];
		}
	}

//	console.log(columns);

	if(modifier === 'VALUE') {
//		console.log(222,res);
		if(res.length > 0) {
			var key;
			if(columns && columns.length > 0){
				key = columns[0].columnid;
			} else {
				key = Object.keys(res[0])[0];
			}
			res = res[0][key];
		} else {
			res = undefined;
		}
	} else if(modifier === 'ROW') {
		if(res.length > 0) {
			var key;
			var a = [];
			for(var key in res[0]) {
				a.push(res[0][key]);
			}
			res = a;
		} else {
			res = undefined;
		}
	} else if(modifier === 'COLUMN') {
		var ar = [];
		if(res.length > 0) {
			var key;
			if(columns && columns.length > 0){
				key = columns[0].columnid;
			} else {
				key = Object.keys(res[0])[0];
			}

			for(var i=0, ilen=res.length; i<ilen; i++){
				ar.push(res[i][key]);
			}
		}
		res = ar;
	} else if(modifier === 'MATRIX') {
		// Returns square matrix of rows
		var ar = [];
		for(var i=0;i<res.length;i++) {		
			var a = [];
			var r = res[i];
			for(var j=0;j<columns.length;j++) {
				a.push(r[columns[j].columnid]);
			}
			ar.push(a);
		}
		res = ar;

	}else if(modifier === 'INDEX') {
		var ar = {};
		var key,val;
		if(columns && columns.length > 0) {
			key = columns[0].columnid;
			val = columns[1].columnid;
		} else {
			var okeys = Object.keys(res[0]);
			key = okeys[0];
			val = okeys[1];
		}
		for(var i=0, ilen=res.length; i<ilen; i++){
			ar[res[i][key]] = res[i][val];
		}
		res = ar;
//		res = arrayOfArrays(res);
	}else if(modifier === 'RECORDSET') {
		res = new alasql.Recordset({data:res, columns:columns});
//		res = arrayOfArrays(res);
	}else if(modifier === 'TEXTSTRING') {
		var key;
		if(columns && columns.length > 0){
			key = columns[0].columnid;
		} else{
			key = Object.keys(res[0])[0];
		}

		for(var i=0, ilen=res.length; i<ilen; i++){
			res[i] = res[i][key];
		}
		res = res.join('\n');
//		res = arrayOfArrays(res);
	}
	return res;
}



// yy.Select.prototype.exec = function(databaseid) {
// 	throw new Error('Select statement should be precompiled');

// };
yy.Select.prototype.execute = function (databaseid, params, cb) {
	return this.compile(databaseid)(params,cb);
//	throw new Error('Insert statement is should be compiled')
}

/*
//
// EXISTS and other subqueries functions  functions for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

yy.ExistsValue = function(params) { return yy.extend(this, params); }
yy.ExistsValue.prototype.toString = function() {
	return 'EXISTS('+this.value.toString()+')';
};

yy.ExistsValue.prototype.toType = function() {
	return 'boolean';
};

yy.ExistsValue.prototype.toJS = function(context,tableid,defcols) {
//	return 'ww=this.existsfn['+this.existsidx+'](params,null,p),console.log(ww),ww.length';
	
	return 'this.existsfn['+this.existsidx+'](params,null,'+context+').data.length';
};

yy.Select.prototype.compileWhereExists = function(query) {
	if(!this.exists) return;
	query.existsfn = this.exists.map(function(ex) {
		var nq = ex.compile(query.database.databaseid);
//		console.log(nq);
//		 if(!nq.query.modifier) nq.query.modifier = 'RECORDSET';
		 nq.query.modifier = 'RECORDSET';
		 return nq;
	});
};

yy.Select.prototype.compileQueries = function(query) {
	if(!this.queries) return;
	query.queriesfn = this.queries.map(function(q) {
		 var nq = q.compile(query.database.databaseid);
//		console.log(nq);
//	if(!nq.query) nq.query = {};
		 nq.query.modifier = 'RECORDSET';
//		 if(!nq.query.modifier) nq.query.modifier = 'RECORDSET';
		 return nq;
	});
};

//
// Prepare subqueries and exists
//
alasql.precompile = function(statement,databaseid,params){
//	console.log(statement);
	if(!statement) return;
	statement.params = params;
	if(statement.queries) {	
//console.log(52,statement.queries[0]);
		statement.queriesfn = statement.queries.map(function(q) {
			var nq = q.compile(databaseid || statement.database.databaseid);
//			console.log(nq);
//			 nq.query.modifier = undefined;
//			 if(!nq.query.modifier) nq.query.modifier = 'RECORDSET';
		 nq.query.modifier = 'RECORDSET';
			 return nq;

		});
	}
	if(statement.exists) {
//console.log(62,statement.exists);
		statement.existsfn = statement.exists.map(function(ex) {
			var nq = ex.compile(databaseid || statement.database.databaseid);
//			console.log(nq.query.modifier);
//			 if(!nq.query.modifier) nq.query.modifier = 'RECORDSET';
//			 if(!nq.query.modifier) nq.query.modifier = 'ARRAY';
		 nq.query.modifier = 'RECORDSET';
			 return nq;

		});
	};
}
/*
//
// Select compiler part for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

yy.Select.prototype.compileFrom = function(query) {
//	console.log(1);
	var self = this;
	query.sources = [];
//	var tableid = this.from[0].tableid;
//	var as = '';
//	if(self.from[0].as) as = this.from[0].as;
//console.log(this);
	query.aliases = {};
	if(!self.from) return;

//console.log(self.from);

	self.from.forEach(function(tq){
		//console.log(tq);
//console.log(tq,tq.toJS());

		var alias = tq.as || tq.tableid;
//		console.log(alias);
		if(tq instanceof yy.Table) {
//			console.log(tq, tq.databaseid, query);
			query.aliases[alias] = {tableid: tq.tableid, databaseid: tq.databaseid || query.database.databaseid, type:'table'};
		} else if(tq instanceof yy.Select) {
			query.aliases[alias] = {type:'subquery'};
		} else if(tq instanceof yy.Search) {
			query.aliases[alias] = {type:'subsearch'};
		} else if(tq instanceof yy.ParamValue) {
			query.aliases[alias] = {type:'paramvalue'};
		} else if(tq instanceof yy.FuncValue) {
			query.aliases[alias] = {type:'funcvalue'};
		} else if(tq instanceof yy.VarValue) {
			query.aliases[alias] = {type:'varvalue'};
		} else if(tq instanceof yy.FromData) {
			query.aliases[alias] = {type:'fromdata'};
		} else if(tq instanceof yy.Json) {
			query.aliases[alias] = {type:'json'};
		} else {
			throw new Error('Wrong table at FROM');
		}

		var source = {
			alias: alias,
			databaseid: tq.databaseid || query.database.databaseid,
			tableid: tq.tableid,
			joinmode: 'INNER',
			onmiddlefn: returnTrue,			
			srcwherefns: '',	// for optimization
			srcwherefn: returnTrue,
//			columns: []			
		};

		if(tq instanceof yy.Table) {
			// Get columns from table
			source.columns = alasql.databases[source.databaseid].tables[source.tableid].columns;
//			console.log('test',alasql.options.autocommit);
//				console.log(997,alasql.databases[source.databaseid].engineid);
// console.log(0,source.databaseid);
// console.log(1,alasql.databases[source.databaseid]);
// console.log(2,alasql.databases[source.databaseid].tables[source.tableid].view);
			if(alasql.options.autocommit && alasql.databases[source.databaseid].engineid) {
//				console.log(997,alasql.databases[source.databaseid].engineid);
// TODO -- make view for external engine
				source.datafn = function(query,params,cb,idx, alasql) {
					return alasql.engines[alasql.databases[source.databaseid].engineid].fromTable(
						source.databaseid, source.tableid,cb,idx,query);
				}				
			} else if(alasql.databases[source.databaseid].tables[source.tableid].view){
				source.datafn = function(query,params,cb,idx, alasql) {
					var res = alasql.databases[source.databaseid].tables[source.tableid].select(params);
					if(cb) res = cb(res,idx,query);
					return res;
				}
			} else {
//				console.log('here');
//				console.log(420,72,alasql.databases[source.databaseid].tables[source.tableid]);
				source.datafn = function(query,params,cb,idx, alasql) {
				// if(!query) console.log('query');
				// if(!query.database) console.log('query');
				// if(!query.database.tables) console.log('query');
				// if(!source.tableid) console.log('query');
				// if(!query.database.tables[source.tableid]) console.log(query);
				// if(!query.database.tables[source.tableid].data) console.log('query');
					var res = alasql.databases[source.databaseid].tables[source.tableid].data;
//				console.log(500,res);
					if(cb) res = cb(res,idx,query);
//				console.log(600,res);
					return res;
//				return alasql.databases[source.databaseid].tables[source.tableid].data;
				};
			}
		} else if(tq instanceof yy.Select) {

			source.subquery = tq.compile(query.database.databaseid);
			if(typeof source.subquery.query.modifier == 'undefined') {
				source.subquery.query.modifier = 'RECORDSET'; // Subqueries always return recordsets
			}
			source.columns = source.subquery.query.columns;
//			console.log(101,source.columns);
//			tq.columns;

			source.datafn = function(query, params, cb, idx, alasql) {
//				return source.subquery(query.params, cb, idx, query);
				var res;
				source.subquery(query.params, function(data){
					res = data.data;
					if(cb) res = cb(res,idx,query);
					return res;
//					return data.data;
				});
//					console.log(515,res);
				return res;
			}						
		} else if(tq instanceof yy.Search) {

			 source.subsearch = tq;
			 source.columns = [];
			 //.compile(query.database.databaseid);
			// if(typeof source.subquery.query.modifier == 'undefined') {
			// 	source.subquery.query.modifier = 'RECORDSET'; // Subqueries always return recordsets
			// }
			// source.columns = source.subquery.query.columns;
//			console.log(101,source.columns);
//			tq.columns;

			source.datafn = function(query, params, cb, idx, alasql) {
//				return source.subquery(query.params, cb, idx, query);
				var res;
				source.subsearch.execute(query.database.databaseid,query.params,function(data){
					res = data;
					if(cb) res = cb(res,idx,query);
					return res;
//					return data.data;
				});
//					console.log(515,res);
				return res;
			}						
		} else if(tq instanceof yy.ParamValue) {

			var ps = "var res = alasql.prepareFromData(params['"+tq.param+"']";
//				console.log(tq);
			if(tq.array) ps+=",true";
			ps += ");if(cb)res=cb(res,idx,query);return res"
			source.datafn = new Function('query,params,cb,idx,alasql',ps);

		} else if(tq instanceof yy.Json) {
			var ps = "var res = alasql.prepareFromData("+tq.toJS();
//				console.log(tq);
			if(tq.array) ps+=",true";
			ps += ");if(cb)res=cb(res,idx,query);return res"
			source.datafn = new Function('query,params,cb,idx,alasql',ps);
		} else if(tq instanceof yy.VarValue) {
			var ps = "var res = alasql.prepareFromData(alasql.vars['"+tq.variable+"']";
//				console.log(tq);
			if(tq.array) ps+=",true";
			ps += ");if(cb)res=cb(res,idx,query);return res"
			source.datafn = new Function('query,params,cb,idx,alasql',ps);
		} else if(tq instanceof yy.FuncValue) {
			var s = "var res=alasql.from['"+tq.funcid.toUpperCase()+"'](";
			// if(tq.args && tq.args.length>0) {
			// 	s += tq.args.map(function(arg){
			// 		return arg.toJS();
			// 	}).concat('cb,idx,query').join(',');
			// }
			// if(tq.args && tq.args.length>0) {
			// 	s += tq.args.map(function(arg){
			// 		return arg.toJS();
			// 	}).concat().join(',');
			// }
			if(tq.args && tq.args.length>0) {
				if(tq.args[0]) {
					s += tq.args[0].toJS('query.oldscope')+',';
				} else {
					s += 'null,';
				};
				if(tq.args[1]) {
					s += tq.args[1].toJS('query.oldscope')+',';
				} else {
					s += 'null,';
				};
			} else {
				s += 'null,null,'
			}
			s += 'cb,idx,query';
			s += ');/*if(cb)res=cb(res,idx,query);*/return res';
//	console.log(s);
			source.datafn = new Function('query, params, cb, idx, alasql',s);

		} else if(tq instanceof yy.FromData) {
				source.datafn = function(query,params,cb,idx, alasql) {
					var res = tq.data;
					if(cb) res = cb(res,idx,query);
					return res;
				}				
		} else {
			throw new Error('Wrong table at FROM');
		}
//		source.data = alasql.databases[source.databaseid].tables[source.tableid].data;
		query.sources.push(source);

	});
	// TODO Add joins
	query.defaultTableid = query.sources[0].alias;
//console.log(query.defaultTableid);
};

alasql.prepareFromData = function(data,array) {
//console.log(177,data,array);
	var res = data;
	if(typeof data == "string") {
		res = data.split(/\r?\n/);
		if(array) {
			for(var i=0, ilen=res.length; i<ilen;i++) {
				res[i] = [res[i]];
			}
		}
	} else if(array) {
		res = [];
		for(var i=0, ilen=data.length; i<ilen;i++) {
			res.push([data[i]]);
		}
//		console.log(res);
	} else if(typeof data == 'object' && !(data instanceof Array)) {
//	} else if(typeof data == 'object' && !(typeof data.length == 'undefined')) {
		if(typeof Mongo != 'undefined' && typeof Mongo.Collection != 'undefined'
			&& data instanceof Mongo.Collection) {
			res = data.find().fetch();
		} else {
			res = [];
			for(var key in data) {
				if(data.hasOwnProperty(key)) res.push([key,data[key]]);
			};			
		}

//		console.log(res);
	};
//	console.log(typeof data);
	return res;
};


/*
//
// Select compiler part for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

// SELECT Compile functions


// Compile JOIN caluese
yy.Select.prototype.compileJoins = function(query) {
//	console.log(this);
//	debugger;
	var self = this;




	this.joins.forEach(function(jn){

		// Test CROSS-JOIN
		if(jn.joinmode == "CROSS") {
			if(jn.using || jn.on) {
				throw new Error('CROSS JOIN cannot have USING or ON clauses');
			} else {
				jn.joinmode == "INNER";
			}
		}

		var source;
		var tq;

		if(jn instanceof yy.Apply) {
//			console.log('APPLY',jn.applymode);
			source = {
				alias: jn.as,
				applymode: jn.applymode,
				onmiddlefn: returnTrue,
				srcwherefns: '',	// for optimization
				srcwherefn: returnTrue,
				columns: [] // TODO check this
			};
			source.applyselect = jn.select.compile(query.database.databaseid);
			source.columns = source.applyselect.query.columns;

			source.datafn = function(query,params,cb,idx, alasql) {
				var res;
				if(cb) res = cb(res,idx,query);
				return res;
			}

			query.sources.push(source);
		} else {

		if(jn.table) {
			tq = jn.table;
			source = {
				alias: jn.as||tq.tableid,
				databaseid: tq.databaseid || query.database.databaseid,
				tableid: tq.tableid,
				joinmode: jn.joinmode,
				onmiddlefn: returnTrue,
				srcwherefns: '',	// for optimization
				srcwherefn: returnTrue,
				columns: []				
			};
			//

//			console.log(source.databaseid, source.tableid);
			if(!alasql.databases[source.databaseid].tables[source.tableid]) {
				throw new Error('Table \''+source.tableid+
				'\' is not exists in database \''+source.databaseid)+'\'';
			};

			source.columns = alasql.databases[source.databaseid].tables[source.tableid].columns;

			// source.data = query.database.tables[source.tableid].data;
			if(alasql.options.autocommit && alasql.databases[source.databaseid].engineid) {
//				console.log(997,alasql.databases[source.databaseid].engineid);
				source.datafn = function(query,params, cb, idx, alasql) {
//					console.log(777,arguments);
					return alasql.engines[alasql.databases[source.databaseid].engineid].fromTable(
						source.databaseid, source.tableid, cb, idx,query);
				}				
			} else if(alasql.databases[source.databaseid].tables[source.tableid].view){
				source.datafn = function(query,params,cb,idx, alasql) {
					var res = alasql.databases[source.databaseid].tables[source.tableid].select(params);
					if(cb) res = cb(res,idx,query);
					return res;
				}
			} else {
				source.datafn = function(query,params,cb, idx, alasql) {
					var res = alasql.databases[source.databaseid].tables[source.tableid].data;
					if(cb) res = cb(res,idx,query);
					return res;
				}
			};

//		var alias = jn.as || tq.tableid;
//		if(tq) {
			query.aliases[source.alias] = {tableid: tq.tableid, databaseid: tq.databaseid || query.database.databaseid};
//		}


		} else if(jn.select) {
			var tq = jn.select;
			source = {
				alias: jn.as,
//				databaseid: jn.databaseid || query.database.databaseid,
//				tableid: tq.tableid,
				joinmode: jn.joinmode,
				onmiddlefn: returnTrue,
				srcwherefns: '',	// for optimization
				srcwherefn: returnTrue,
				columns: []
			};
			
			source.subquery = tq.compile(query.database.databaseid);
			if(typeof source.subquery.query.modifier == 'undefined') {
				source.subquery.query.modifier = 'RECORDSET'; // Subqueries always return recordsets
			}
			source.columns = source.subquery.query.columns;
			
//			if(jn instanceof yy.Apply) {
				source.datafn = function(query, params, cb, idx, alasql) {
//					return cb(null,idx,alasql);
					return source.subquery(query.params, null, cb, idx).data;
				}				
			// } else {
			// 	source.datafn = function(query, params, cb, idx, alasql) {
			// 		return source.subquery(query.params, null, cb, idx);
			// 	}				
			// }
			query.aliases[source.alias] = {type:'subquery'};
		} else if(jn.param) {
			source = {
				alias: jn.as,
//				databaseid: jn.databaseid || query.database.databaseid,
//				tableid: tq.tableid,
				joinmode: jn.joinmode,
				onmiddlefn: returnTrue,
				srcwherefns: '',	// for optimization
				srcwherefn: returnTrue
			};
			// source.data = ;
			var jnparam = jn.param.param;
//			console.log(jn, jnparam);
			var ps = "var res=alasql.prepareFromData(params['"+jnparam+"']";
			if(jn.array) ps += ",true";
			ps += ");if(cb)res=cb(res, idx, query);return res";

			source.datafn = new Function('query,params,cb,idx, alasql',ps);
			query.aliases[source.alias] = {type:'paramvalue'};
		} else if(jn.variable) {
			source = {
				alias: jn.as,
//				databaseid: jn.databaseid || query.database.databaseid,
//				tableid: tq.tableid,
				joinmode: jn.joinmode,
				onmiddlefn: returnTrue,
				srcwherefns: '',	// for optimization
				srcwherefn: returnTrue
			};
			// source.data = ;
//			var jnparam = jn.param.param;
//			console.log(jn, jnparam);
			var ps = "var res=alasql.prepareFromData(alasql.vars['"+jn.variable+"']";
			if(jn.array) ps += ",true";
			ps += ");if(cb)res=cb(res, idx, query);return res";

			source.datafn = new Function('query,params,cb,idx, alasql',ps);
			query.aliases[source.alias] = {type:'varvalue'};
		} else if(jn.funcid) {
			source = {
				alias: jn.as,
//				databaseid: jn.databaseid || query.database.databaseid,
//				tableid: tq.tableid,
				joinmode: jn.joinmode,
				onmiddlefn: returnTrue,
				srcwherefns: '',	// for optimization
				srcwherefn: returnTrue
			};
			// source.data = ;

/*
			var jnparam = jn.param.param;
			source.datafn = new Function('query,params,cb,idx',
				"var res=alasql.prepareFromData(params['"+jnparam+"']);if(cb)res=cb(res, idx, query);return res");
*/

			var s = "var res=alasql.from['"+js.funcid.toUpperCase()+"'](";
			// if(tq.args && tq.args.length>0) {
			// 	s += tq.args.map(function(arg){
			// 		return arg.toJS();
			// 	}).concat('cb,idx,query').join(',');
			// }
			// if(tq.args && tq.args.length>0) {
			// 	s += tq.args.map(function(arg){
			// 		return arg.toJS();
			// 	}).concat().join(',');
			// }
			if(jn.args && jn.args.length>0) {
				if(jn.args[0]) {
					s += jn.args[0].toJS('query.oldscope')+',';
				} else {
					s += 'null,';
				};
				if(jn.args[1]) {
					s += jn.args[1].toJS('query.oldscope')+',';
				} else {
					s += 'null,';
				};
			} else {
				s += 'null,null,'
			}
			s += 'cb,idx,query';
			s += ');/*if(cb)res=cb(res,idx,query);*/return res';
//	console.log(s);
			source.datafn = new Function('query, params, cb, idx, alasql',s);

			query.aliases[source.alias] = {type:'funcvalue'};
		}
/*
		} else if(tq instanceof yy.Select) {
			query.aliases[alias] = {type:'subquery'};
		} else if(tq instanceof yy.ParamValue) {
			query.aliases[alias] = {type:'paramvalue'};
		} else if(tq instanceof yy.FuncValue) {
			query.aliases[alias] = {type:'paramvalue'};
		} else {
			throw new Error('Wrong table at FROM');
		}
*/
		var alias = source.alias;

		// Test NATURAL-JOIN
		if(jn.natural) {
			if(jn.using || jn.on) {
				throw new Error('NATURAL JOIN cannot have USING or ON clauses');
			} else {
//				source.joinmode == "INNER";
				if(query.sources.length > 0) {
					var prevSource = query.sources[query.sources.length-1];
					var prevTable = alasql.databases[prevSource.databaseid].tables[prevSource.tableid];
					var table = alasql.databases[source.databaseid].tables[source.tableid];

					if(prevTable && table) {
						var c1 = prevTable.columns.map(function(col){return col.columnid});
						var c2 = table.columns.map(function(col){return col.columnid});
						jn.using = arrayIntersect(c1,c2).map(function(colid){return {columnid:colid}});
//						console.log(jn.using);
					} else {
						throw new Error('In this version of Alasql NATURAL JOIN '+
							'works for tables with predefined columns only');
					};
				}
			}
		}







		if(jn.using) {
			var prevSource = query.sources[query.sources.length-1];
//			console.log(query.sources[0],prevSource,source);
			source.onleftfns = jn.using.map(function(col){
//				console.log(141,colid);
				return "p['"+(prevSource.alias||prevSource.tableid)+"']['"+col.columnid+"']";
			}).join('+"`"+');



			source.onleftfn = new Function('p,params,alasql','var y;return '+source.onleftfns);

			source.onrightfns = jn.using.map(function(col){
				return "p['"+(source.alias||source.tableid)+"']['"+col.columnid+"']";
			}).join('+"`"+');
			source.onrightfn = new Function('p,params,alasql','var y;return '+source.onrightfns);
			source.optimization = 'ix';
//			console.log(151,source.onleftfns, source.onrightfns);
//			console.log(source);
		} else if(jn.on) {
//console.log(jn.on);
			if(jn.on instanceof yy.Op && jn.on.op == '=' && !jn.on.allsome) {
//				console.log('ix optimization', jn.on.toJS('p',query.defaultTableid) );
				source.optimization = 'ix';
			// 	source.onleftfns = jn.on.left.toJS('p',query.defaultTableid);
			// 	source.onleftfn = new Function('p', 'return '+source.onleftfns);
			// 	source.onrightfns = jn.on.right.toJS('p',query.defaultTableid);
			// 	source.onrightfn = new Function('p', 'return '+source.onrightfns);

				var lefts = '';
				var rights = '';
				var middles = '';
				var middlef = false;
				// Test right and left sides
				var ls = jn.on.left.toJS('p',query.defaultTableid,query.defcols);
				var rs = jn.on.right.toJS('p',query.defaultTableid,query.defcols);

				if((ls.indexOf("p['"+alias+"']")>-1) && !(rs.indexOf("p['"+alias+"']")>-1)){
					if((ls.match(/p\[\'.*?\'\]/g)||[]).every(function(s){ 
						return s == "p['"+alias+"']"})) { rights = ls; } 
						else { middlef = true };

				} else 	if(!(ls.indexOf("p['"+alias+"']")>-1) && (rs.indexOf("p['"+alias+"']")>-1)){
					if((rs.match(/p\[\'.*?\'\]/g)||[]).every(function(s){ 
						return s == "p['"+alias+"']"})) { lefts = ls; } 
						else { middlef = true };
				} else {
					middlef = true;
				}

//				console.log(alias, 1,lefts, rights, middlef);

				if((rs.indexOf("p['"+alias+"']")>-1) && !(ls.indexOf("p['"+alias+"']")>-1)){
					if((rs.match(/p\[\'.*?\'\]/g)||[]).every(function(s){ 
						return s == "p['"+alias+"']"})) { rights = rs; } 
						else { middlef = true };
				} else if(!(rs.indexOf("p['"+alias+"']")>-1) && (ls.indexOf("p['"+alias+"']")>-1)){
					if((ls.match(/p\[\'.*?\'\]/g)||[]).every(function(s){ 
						return s == "p['"+alias+"']"})) { lefts = rs; } 
						else { middlef = true };
				} else {
					middlef = true;
				}

//				console.log(alias, 2,lefts, rights, middlef);

				if(middlef) {
//					middles = jn.on.toJS('p',query.defaultTableid);
//				} else {
					rights = '';
					lefts = '';
					middles = jn.on.toJS('p',query.defaultTableid,query.defcols);
					source.optimization = 'no';
					// What to here?
				} 

				source.onleftfns = lefts;
				source.onrightfns = rights;
				source.onmiddlefns = middles || 'true';
//			console.log(source.onleftfns, '-',source.onrightfns, '-',source.onmiddlefns);

				source.onleftfn = new Function('p,params,alasql', 'var y;return '+source.onleftfns);
				source.onrightfn = new Function('p,params,alasql', 'var y;return '+source.onrightfns);
				source.onmiddlefn = new Function('p,params,alasql', 'var y;return '+source.onmiddlefns);

//			} else if(jn.on instanceof yy.Op && jn.on.op == 'AND') {
//				console.log('join on and ',jn);

			} else {
//				console.log('no optimization');
				source.optimization = 'no';
//				source.onleftfn = returnTrue;
//				source.onleftfns = "true";
				source.onmiddlefns = jn.on.toJS('p',query.defaultTableid,query.defcols);
				source.onmiddlefn = new Function('p,params,alasql','var y;return '+jn.on.toJS('p',query.defaultTableid,query.defcols));
			};
//			console.log(source.onleftfns, source.onrightfns, source.onmiddlefns);

			// Optimization function
		};

//		source.data = alasql.databases[source.databaseid].tables[source.tableid].data;
//console.log(source, jn);
		// TODO SubQueries
/*		if(source.joinmode == 'RIGHT') {
			var prevSource = query.sources.pop();
			if(prevSource.joinmode == 'INNER') {
				prevSource.joinmode = 'LEFT';
				var onleftfn = prevSource.onleftfn;
				var onleftfns = prevSource.onleftfns;
				var onrightfn = prevSource.onrightfn;
				var onrightfns = prevSource.onrightfns;
				var optimization = prevSource.optimization;

				prevSource.onleftfn = source.onrightfn;
				prevSource.onleftfns = source.onrightfns;
				prevSource.onrightfn = source.onleftfn;
				prevSource.onrightfns = source.onleftfns;
				prevSource.optimization = source.optimization;

				source.onleftfn = onleftfn;
				source.onleftfns = onleftfns;
				source.onrightfn = onrightfn;
				source.onrightfns = onrightfns;
				source.optimization = optimization;

				source.joinmode = 'INNER';
				query.sources.push(source);
				query.sources.push(prevSource);
			} else {
				throw new Error('Do not know how to process this SQL');
			}
		} else {
			query.sources.push(source);
		}
*/	
		query.sources.push(source);
		};
	});
//	console.log('sources',query.sources);
}


yy.Select.prototype.compileWhere = function(query) {
	if(this.where) {
		if(typeof this.where == "function") {
			return this.where;
		} else {
			s = this.where.toJS('p',query.defaultTableid,query.defcols);
			query.wherefns = s;
//		console.log(s);
			return new Function('p,params,alasql','var y;return '+s);
		}
	} else return function(){return true};
};



yy.Select.prototype.compileWhereJoins = function(query) {
	return;

	// TODO Fix Where optimization
	//console.log(query);

	optimizeWhereJoin(query, this.where.expression);

	//for sources compile wherefs
	query.sources.forEach(function(source) {
		if(source.srcwherefns) {
			source.srcwherefn = new Function('p,params,alasql','var y;return '+source.srcwherefns);
		};
		if(source.wxleftfns) {
			source.wxleftfn = new Function('p,params,alasql','var y;return '+source.wxleftfns);
		};
		if(source.wxrightfns) {
			source.wxrightfn = new Function('p,params,alasql','var y;return '+source.wxrightfns);
		};
//		console.log(source.alias, source.wherefns)
//		console.log(source);
	});
};

function optimizeWhereJoin (query, ast) {
	if(!ast) return false;
	if(!(ast instanceof yy.Op)) return;
	if(ast.op != '=' && ast.op != 'AND') return;
	if(ast.allsome) return;

	var s = ast.toJS('p',query.defaultTableid,query.defcols);
	var fsrc = [];
	query.sources.forEach(function(source,idx) {
		// Optimization allowed only for tables only
		if(source.tableid) {
			// This is a good place to remove all unnecessary optimizations
			if(s.indexOf('p[\''+source.alias+'\']')>-1) fsrc.push(source);
		};
	});
//console.log(fsrc.length);
//	if(fsrc.length < query.sources.length) return;
//	console.log(ast);
//	console.log(s);
//	console.log(fsrc.length);
	if(fsrc.length == 0) {
//		console.log('no optimization, can remove this part of ast');
		return;
	} else if (fsrc.length == 1) {

		if(!(s.match(/p\[\'.*?\'\]/g)||[])
			.every(function(s){ 
						return s == "p['"+fsrc[0].alias+"']"})) { 
			return; 
			// This is means, that we have column from parent query
			// So we return without optimization
		} 

		var src = fsrc[0]; // optmiization source
		src.srcwherefns = src.srcwherefns ? src.srcwherefns+'&&'+s : s;

		if((ast instanceof yy.Op) && (ast.op == '=' && !ast.allsome)) {
			if(ast.left instanceof yy.Column) {
				var ls = ast.left.toJS('p',query.defaultTableid,query.defcols);
				var rs = ast.right.toJS('p',query.defaultTableid,query.defcols);
				if(rs.indexOf('p[\''+fsrc[0].alias+'\']') == -1) {
					fsrc[0].wxleftfns = ls; 
					fsrc[0].wxrightfns = rs; 
				} 
			} if(ast.right instanceof yy.Column) {
				var ls = ast.left.toJS('p',query.defaultTableid,query.defcols);
				var rs = ast.right.toJS('p',query.defaultTableid,query.defcols);
				if(ls.indexOf('p[\''+fsrc[0].alias+'\']') == -1) {
					fsrc[0].wxleftfns = rs; 
					fsrc[0].wxrightfns = ls; 
				} 
			}
		}
		ast.reduced = true;  // To do not duplicate wherefn and srcwherefn
		return;
	} else {
		if(ast.op = 'AND') {
			optimizeWhereJoin(query,ast.left);
			optimizeWhereJoin(query,ast.right);
		} 
	}

};



/*
//
// Select compiler part for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

/**
 Compile group of statements
 */
yy.Select.prototype.compileGroup = function(query) {
//	console.log(this.group);
	if(query.sources.length > 0) {
		var tableid = query.sources[0].alias;
	} else {
		// If SELECT contains group aggregators without source tables
		var tableid = '';
	}
	var defcols = query.defcols;
//	console.log(16,tableid, defcols);

//	console.log(query.sources[0].alias,query.defcols);
	var allgroup = [[]];
	if(this.group) {
		allgroup = decartes(this.group,query);
	}
//	console.log(23,allgroup);

//	console.log(allgroup);
	// Prepare groups
	//var allgroup = [['a'], ['a','b'], ['a', 'b', 'c']];

	// Union all arrays to get a maximum
	var allgroups = [];
	allgroup.forEach(function(a){
		allgroups = arrayUnion(allgroups, a);
	});

	query.allgroups = allgroups;

//console.log(42,294, this.group);
//console.log(allgroups);
//		console.log(42,364,query.selectColumns)

/*
if(false) {
	allgroups.forEach(function(col2){
//		console.log(42,365,colid, query.selectColumns[colid])
		if(query.selectColumns[colid]) {
//			console.log(colid,'ok');
		} else {
//			if(colid.indexOf())
//			console.log(colid,'bad');	
			var tmpid = 'default';
			if(query.sources.length > 0) tmpid = query.sources[0].alias;
//			console.log(new yy.Column({columnid:colid}).toJS('p',query.sources[0].alias));
//			query.selectfns += 'r[\''+colid+'\']=p[\''+tmpid+'\'][\''+colid+'\'];';
//console.log(374, colid);
			if(Object.keys(query.selectColumns).length != 0) query.removeKeys.push(colid);
			query.selectfns += 'r[\''+escapeq(colid)+'\']='+(new yy.Column({columnid:colid}).toJS('p',tmpid))+';';
		}
	});
};
*/
	// Create negative array

	var s = '';
//	s+= query.selectfns;

	allgroup.forEach(function(agroup) {
//console.log(agroup);

		// Start of group function
		s += 'var acc,g=this.xgroups[';

	//	var gcols = this.group.map(function(col){return col.columnid}); // Group fields with r
		// Array with group columns from record
		var rg = agroup.map(function(col2){
			var columnid = col2.split('\t')[0];
			var coljs = col2.split('\t')[1];
			// Check, if aggregator exists but GROUP BY is not exists
			if(columnid === ''){
				return '1'; // Create fictive groupping column for fictive GROUP BY
			}
//			else return "r['"+columnid+"']";
			return coljs;
		});

		if(rg.length === 0){
			rg = ["''"];
		}

	//	console.log('rg',rg);

		s += rg.join('+"`"+');
		s += '];if(!g) {this.groups.push((g=this.xgroups[';
		s += rg.join('+"`"+');
		s += '] = {';
//		s += ']=r';
		s += agroup.map(function(col2){
			var columnid = col2.split('\t')[0];
			var coljs = col2.split('\t')[1];

			if(columnid === ''){
				return '';
			}
			
			return "'"+columnid+"':"+coljs+",";
		}).join('');

		var neggroup = arrayDiff(allgroups,agroup);

//		console.log(neggroup);

		s += neggroup.map(function(col2){			
			var columnid = col2.split('\t')[0];
		//	var coljs = col2.split('\t')[1]
			return "'"+columnid+"':null,";
		}).join('');

		var aft = '';
//		s += self.columns.map(function(col){
//console.log('query.selectGroup',query.selectGroup);
		s += query.selectGroup.map(function(col){
//console.log(idx, col.toString(), col.as);
			var colexp = col.expression.toJS("p",tableid,defcols);
			var colas = col.nick;
			// if(typeof colas == 'undefined') {
			// 	if(col instanceof yy.Column) colas = col.columnid;
			// 	else colas = col.toString();
			// };
			if (col instanceof yy.AggrValue) { 
				if(col.distinct) {
					aft += ',g[\'$$_VALUES_'+colas+'\']={},g[\'$$_VALUES_'+colas+'\']['+colexp+']=true';
				}
				if (col.aggregatorid === 'SUM'
//					|| col.aggregatorid == 'AVG'
//				) { return "'"+col.as+'\':r[\''+col.as+'\'],'; }//f.field.arguments[0].toJS(); 	
				){ 
					return "'"+colas+'\':('+colexp+')||0,'; //f.field.arguments[0].toJS(); 	
				
				} else if (
							col.aggregatorid === 'MIN'
							|| col.aggregatorid === 'MAX'
							|| col.aggregatorid === 'FIRST'
							|| col.aggregatorid === 'LAST'
		//					|| col.aggregatorid == 'AVG'
//							) { return "'"+col.as+'\':r[\''+col.as+'\'],'; }//f.field.arguments[0].toJS(); 	
				){ 
					return "'"+colas+'\':'+colexp+','; //f.field.arguments[0].toJS(); 	
				
				} else if(col.aggregatorid === 'ARRAY') {
				 	return "'"+colas+'\':['+colexp+'],';

				} else if(col.aggregatorid === 'COUNT') { 
					if(col.expression.columnid === '*') {
						return "'"+colas+'\':1,';
					} else {
//						return "'"+colas+'\':(typeof '+colexp+' != "undefined")?1:0,';  
//					} else {
						return "'"+colas+'\':(typeof '+colexp+' != "undefined")?1:0,'; 
					}

//				else if(col.aggregatorid == 'MIN') { return "'"+col.as+'\':r[\''+col.as+'\'],'; }
//				else if(col.aggregatorid == 'MAX') { return "'"+col.as+'\':r[\''+col.as+'\'],'; }
				} else if(col.aggregatorid === 'AVG') { 
					query.removeKeys.push('_SUM_'+colas);
					query.removeKeys.push('_COUNT_'+colas);
					
					return	''
							+ "'" + colas + '\':' + colexp + ',\'_SUM_'
							+ colas+'\':(' + colexp + ')||0,\'_COUNT_'
							+ colas + '\':(typeof '
							+ colexp+' != "undefined")?1:0,'; 
				} else if(col.aggregatorid === 'AGGR') {
					aft += ',g[\''+colas+'\']='+col.expression.toJS('g',-1); 
					return '';
				} else if(col.aggregatorid === 'REDUCE') {
					query.removeKeys.push('_REDUCE_'+colas);
					return "'"+colas+'\':alasql.aggr[\''+col.funcid+'\']('+colexp+',undefined,(acc={})),'
					+'\'__REDUCE__'+colas+'\':acc,'; 
				}
				return '';
			} 

			return '';

		}).join('');





		// columnid:r.columnid
	//	var srg = [];//rg.map(function(fn){ return (fn+':'+fn); });

	//	var srg = this.group.map(function(col){
	//		if(col == '') return '';
	//		else return col.columnid+':'+col.toJS('r','');
	//	});

	// Initializw aggregators

	/*
		this.columns.forEach(function(col){
	//		console.log(f);
	//			if(f.constructor.name == 'LiteralValue') return '';


			if (col instanceof yy.AggrValue) { 
				if (col.aggregatorid == 'SUM') { srg.push("'"+col.as+'\':0'); }//f.field.arguments[0].toJS(); 	
				else if(col.aggregatorid == 'COUNT') {srg.push( "'"+col.as+'\':0'); }
				else if(col.aggregatorid == 'MIN') { srg.push( "'"+col.as+'\':Infinity'); }
				else if(col.aggregatorid == 'MAX') { srg.push( "'"+col.as+'\':-Infinity'); }
	//			else if(col.aggregatorid == 'AVG') { srg.push(col.as+':0'); }
	//				return 'group.'+f.name.value+'=+(+group.'+f.name.value+'||0)+'+f.field.arguments[0].toJS('rec','')+';'; //f.field.arguments[0].toJS(); 	
			};

		});

	*/

	/*****************/

	//	s += srg.join(',');

		// var ss = [];
		// gff.forEach(function(fn){
		// 	ss.push(fn+':rec.'+fn);
		// });
		// s += ss.join(',');
	//	s += '});};';

		s += '}'+aft+',g));} else {';
	//	console.log(s, this.columns);



	// var neggroup = arrayDiff(allgroups,agroup);

	// console.log(agroup,neggroup);

	// s += neggroup.map(function(columnid){
	// 	return "g['"+columnid+"']=null;";
	// }).join('');

	// console.log(s);


	//console.log(query.selectfn);
//		s += self.columns.map(function(col){
		s += query.selectGroup.map(function(col){
			var colas = col.nick;
			// if(typeof colas == 'undefined') {
			// 	if(col instanceof yy.Column) colas = col.columnid;
			// 	else colas = col.toString();
			// }
			var colexp = col.expression.toJS("p",tableid,defcols);

			if (col instanceof yy.AggrValue) { 
				var pre = '', post = '';
				if(col.distinct) {
			 		var pre = 'if(typeof '+colexp+'!="undefined" && (!g[\'$$_VALUES_'+colas+'\']['+colexp+'])) \
				 		 {';
				 	var post = 'g[\'$$_VALUES_'+colas+'\']['+colexp+']=true;}';
				} 
				if (col.aggregatorid === 'SUM') { 
					return pre+'g[\''+colas+'\']+=('+colexp+'||0);'+post; //f.field.arguments[0].toJS(); 
				} else if(col.aggregatorid === 'COUNT') {
//					console.log(221,col.expression.columnid == '*');
					if(col.expression.columnid === '*'){
						return pre+'g[\''+colas+'\']++;'+post; 
					} else {
						return pre+'if(typeof '+colexp+'!="undefined") g[\''+colas+'\']++;'+post;
					}
				
				} else if(col.aggregatorid === 'ARRAY') { 
					return pre+'g[\''+colas+'\'].push('+colexp+');'+post; 
				
				} else if(col.aggregatorid === 'MIN') { 
					return pre+'g[\''+colas+'\']=Math.min(g[\''+colas+'\'],'+colexp+');'+post; 
				
				} else if(col.aggregatorid === 'MAX') { 
					return pre+'g[\''+colas+'\']=Math.max(g[\''+colas+'\'],'+colexp+');'+post; 
				
				} else if(col.aggregatorid === 'FIRST') { 
					return ''; 
				
				} else if(col.aggregatorid === 'LAST') { 
					return pre+'g[\''+colas+'\']='+colexp+';'+post; 
				
				} else if(col.aggregatorid === 'AVG') { 
						return 	''
								+ pre+'g[\'_SUM_'+colas+'\']+=(y='+colexp+')||0;'
								+ 'g[\'_COUNT_'+colas+'\']+=(typeof y!="undefined")?1:0;'
								+ 'g[\''+colas+'\']=g[\'_SUM_'+colas+'\']/g[\'_COUNT_'+colas+'\'];'
								+ post; 
//					 }
	//			else if(col.aggregatorid == 'AVG') { srg.push(colas+':0'); }
				} else if(col.aggregatorid === 'AGGR') {
					return 	''
							+ pre+'g[\''+colas+'\']='
					     	+ col.expression.toJS('g',-1)+';'
					     	+ post; 
				
				} else if(col.aggregatorid === 'REDUCE') {
					return 	''
							+ pre+'g[\''+colas+'\']=alasql.aggr.'
							+ col.funcid+'('+colexp+',g[\''+colas+'\'],g[\'__REDUCE__'+colas+'\']);'
							+ post; 
				}

				return '';
			} 

			return '';
		}).join('');


	//	s += selectFields.map(function(f){
	//			console.log(f);
	//			if(f.constructor.name == 'LiteralValue') return '';
	//			if (f.field instanceof SQLParser.nodes.FunctionValue 
	//				&& (f.field.name.toUpperCase() == 'SUM' || f.field.name.toUpperCase() == 'COUNT')) {
	//				return 'group.'+f.name.value+'=+(+group.'+f.name.value+'||0)+'+f.field.arguments[0].toJS('rec','')+';'; //f.field.arguments[0].toJS(); 	
	//				return 'group.'+f.name.value+'+='+f.field.arguments[0].toJS('rec','')+';'; //f.field.arguments[0].toJS(); 	
	//				return 'group.'+f.name.value+'+=rec.'+f.name.value+';'; //f.field.arguments[0].toJS(); 	
	//			};
	//			return '';
	//		}).join('');

		//s += '	group.amt += rec.emplid;';
		//s += 'group.count++;';
		s += '}';

	});

//		console.log('groupfn',s);
	return new Function('p,params,alasql',s);

}

/*
//
// Select compiler part for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

// yy.Select.prototype.compileSources = function(query) {
// 	return sources;
// };

function compileSelectStar (query,alias) {
	// console.log(query.aliases[alias]);
//	console.log(query,alias);
	// console.log(query.aliases[alias].tableid);
//	console.log(42,631,alias);
//	console.log(query.aliases);
	var sp = '', ss=[];
//	if(!alias) {
//		sp += 'for(var k1 in p) var w=p[k1];for(var k2 in w){r[k2]=w[k2]};';
//	} else 	{

		// TODO move this out of this function 
		query.ixsources = {};
		query.sources.forEach(function(source){
			query.ixsources[source.alias] = source;
		});

		// Fixed
		var columns;
		if(query.ixsources[alias]) {
			var columns = query.ixsources[alias].columns;
		}

//		if(columns.length == 0 && query.aliases[alias].tableid) {
//			var columns = alasql.databases[query.aliases[alias].databaseid].tables[query.aliases[alias].tableid].columns;
//		};



		// Check if this is a Table or other

		if(columns && columns.length > 0) {
			columns.forEach(function(tcol){
				ss.push('\''+tcol.columnid+'\':p[\''+alias+'\'][\''+tcol.columnid+'\']');
				query.selectColumns[escapeq(tcol.columnid)] = true;

//			console.log('ok',tcol);

				var coldef = {
					columnid:tcol.columnid, 
					dbtypeid:tcol.dbtypeid, 
					dbsize:tcol.dbsize, 
					dbprecision:tcol.dbprecision,
					dbenum: tcol.dbenum
				};
				query.columns.push(coldef);
				query.xcolumns[coldef.columnid]=coldef;

			});
//console.log(999,columns);			
		} else {
//					console.log(60,alias,columns);

			// if column not exists, then copy all
			sp += 'var w=p["'+alias+'"];for(var k in w){r[k]=w[k]};';
//console.log(777, sp);
			query.dirtyColumns = true;
		}
//	}
//console.log({s:ss.join(','),sp:sp});
	return {s:ss.join(','),sp:sp};
}


yy.Select.prototype.compileSelect1 = function(query) {
	var self = this;
	query.columns = [];
	query.xcolumns = {};
	query.selectColumns = {};
	query.dirtyColumns = false;
	var s = 'var r={';
	var sp = '';
	var ss = [];

//console.log(42,87,this.columns);

	this.columns.forEach(function(col){
//console.log(col);		
		if(col instanceof yy.Column) {
			if(col.columnid === '*') {
				if(col.func) {
					sp += 'r=params[\''+col.param+'\'](p[\''+query.sources[0].alias+'\'],p,params,alasql);';
				} else if(col.tableid) {
					//Copy all
					var ret = compileSelectStar(query, col.tableid);
					if(ret.s){
						ss = ss.concat(ret.s);
					}
					sp += ret.sp;

				} else {
//					console.log('aliases', query.aliases);
					for(var alias in query.aliases) {
						var ret = compileSelectStar(query, alias); //query.aliases[alias].tableid);
						if(ret.s){
							ss = ss.concat(ret.s);
						}
						sp += ret.sp;
					}
					// TODO Remove these lines
					// In case of no information 
					// sp += 'for(var k1 in p){var w=p[k1];'+
					// 			'for(k2 in w) {r[k2]=w[k2]}}'
				}
			} else {
				// If field, otherwise - expression
				var tbid = col.tableid;
//				console.log(query.sources);
				var dbid = col.databaseid || query.sources[0].databaseid || query.database.databaseid;
				if(!tbid) tbid = query.defcols[col.columnid];
				if(!tbid) tbid = query.defaultTableid;
				if(col.columnid !== '_') {
					ss.push('\''+escapeq(col.as || col.columnid)+'\':p[\''+(tbid)+'\'][\''+col.columnid+'\']');
				} else {
					ss.push('\''+escapeq(col.as || col.columnid)+'\':p[\''+(tbid)+'\']');					
				}
				query.selectColumns[escapeq(col.as || col.columnid)] = true;

				if(query.aliases[tbid] && query.aliases[tbid].type === 'table') {

					if(!alasql.databases[dbid].tables[query.aliases[tbid].tableid]) {
//						console.log(query.database,tbid,query.aliases[tbid].tableid);
						throw new Error('Table \''+(tbid)+'\' does not exists in database');
					}
					var columns = alasql.databases[dbid].tables[query.aliases[tbid].tableid].columns;					
					var xcolumns = alasql.databases[dbid].tables[query.aliases[tbid].tableid].xcolumns;
//console.log(xcolumns, col,123);
//					console.log(0);
					if(xcolumns && columns.length > 0) {
//						console.log(1);
						var tcol = xcolumns[col.columnid];
						var coldef = {
							columnid:col.as || col.columnid, 
							dbtypeid:tcol.dbtypeid, 
							dbsize:tcol.dbsize, 
							dbpecision:tcol.dbprecision,
							dbenum: tcol.dbenum,
						};
//						console.log(2);
						query.columns.push(coldef);
						query.xcolumns[coldef.columnid]=coldef;
					} else {
						var coldef = {
							columnid:col.as || col.columnid, 
//							dbtypeid:tcol.dbtypeid, 
//							dbsize:tcol.dbsize, 
//							dbpecision:tcol.dbprecision,
//							dbenum: tcol.dbenum,
						};
//						console.log(2);
						query.columns.push(coldef);
						query.xcolumns[coldef.columnid]=coldef;

						query.dirtyColumns = true;
					}
				} else {
						var coldef = {
							columnid:col.as || col.columnid, 
//							dbtypeid:tcol.dbtypeid, 
//							dbsize:tcol.dbsize, 
//							dbpecision:tcol.dbprecision,
//							dbenum: tcol.dbenum,
						};
//						console.log(2);
						query.columns.push(coldef);
						query.xcolumns[coldef.columnid]=coldef;
					// This is a subquery? 
					// throw new Error('There is now such table \''+col.tableid+'\'');
				}

			}
		} else if(col instanceof yy.AggrValue) {
			if(!self.group) {
//				self.group=[new yy.Column({columnid:'q',as:'q'	})];
				self.group = [''];
			}
			if(!col.as){
				col.as = escapeq(col.toString());
			}
			
			if(
					col.aggregatorid === 'SUM' 
				|| 	col.aggregatorid === 'MAX' 
				||  col.aggregatorid === 'MIN' 
				||	col.aggregatorid === 'FIRST' 
				||	col.aggregatorid === 'LAST' 
				||	col.aggregatorid === 'AVG' 
				|| 	col.aggregatorid === 'ARRAY' 
				|| 	col.aggregatorid === 'REDUCE'
			){
				ss.push("'"+escapeq(col.as)+"':"+n2u(col.expression.toJS("p",query.defaultTableid,query.defcols)))	
			
			}else if(col.aggregatorid === 'COUNT') {
				ss.push("'"+escapeq(col.as)+"':1");
				// Nothing
			}
			// todo: confirm that no default action must be implemented


			query.selectColumns[col.aggregatorid+'('+escapeq(col.expression.toString())+')'] = thtd;


						var coldef = {
							columnid:col.as || col.columnid || col.toString(), 
//							dbtypeid:tcol.dbtypeid, 
//							dbsize:tcol.dbsize, 
//							dbpecision:tcol.dbprecision,
//							dbenum: tcol.dbenum,
						};
//						console.log(2);
						query.columns.push(coldef);
						query.xcolumns[coldef.columnid]=coldef;

//			else if (col.aggregatorid == 'MAX') {
//				ss.push((col.as || col.columnid)+':'+col.toJS("p.",query.defaultTableid))
//			} else if (col.aggregatorid == 'MIN') {
//				ss.push((col.as || col.columnid)+':'+col.toJS("p.",query.defaultTableid))
//			}
		} else {
//			console.log(203,col.as,col.columnid,col.toString());
			ss.push('\''+escapeq(col.as || col.columnid || col.toString())+'\':'+n2u(col.toJS("p",query.defaultTableid,query.defcols)));
//			ss.push('\''+escapeq(col.toString())+'\':'+col.toJS("p",query.defaultTableid));
			//if(col instanceof yy.Expression) {
			query.selectColumns[escapeq(col.as || col.columnid || col.toString())] = true;

						var coldef = {
							columnid:col.as || col.columnid || col.toString(), 
//							dbtypeid:tcol.dbtypeid, 
//							dbsize:tcol.dbsize, 
//							dbpecision:tcol.dbprecision,
//							dbenum: tcol.dbenum,
						};
//						console.log(2);
						query.columns.push(coldef);
						query.xcolumns[coldef.columnid]=coldef;
		}
	});
	s += ss.join(',')+'};'+sp;
	return s;
//console.log(42,753,query.xcolumns, query.selectColumns);
}
yy.Select.prototype.compileSelect2 = function(query) {

	var s = query.selectfns;
//	console.log(s);
	return new Function('p,params,alasql','var y;'+s+'return r');
};


yy.Select.prototype.compileSelectGroup0 = function(query) {
	var self = this;
	self.columns.forEach(function(col,idx){
		if(!(col instanceof yy.Column && col.columnid === '*')){
		
			var colas;
			//  = col.as;
			if(col instanceof yy.Column) {
				colas = escapeq(col.columnid);
			} else {
				colas = escapeq(col.toString());
			}
			for(var i=0;i<idx;i++) {
				if(colas === self.columns[i].nick) {
					colas = self.columns[i].nick+':'+idx;
					break;
				}
			}
			// }
			col.nick = colas;
			if(
				col.funcid 
				&& (col.funcid.toUpperCase() === 'ROWNUM'|| col.funcid.toUpperCase() === 'ROW_NUMBER')) {
				query.rownums.push(col.as);
			}
//				console.log("colas:",colas);
			// }
		}
	});
	
	this.columns.forEach(function(col){
		if(col.findAggregator){
			col.findAggregator(query);
		}
	});

	if(this.having) {
		if(this.having.findAggregator){
			this.having.findAggregator(query);
		}
	}

};

yy.Select.prototype.compileSelectGroup1 = function(query) {
	var self = this;
	var s = 'var r = {};';

	self.columns.forEach(function(col){
//		console.log(col);
		if(col instanceof yy.Column && col.columnid === '*') {
//			s += 'for(var k in g){r[k]=g[k]};';
			s += 'for(var k in this.query.groupColumns){r[k]=g[this.query.groupColumns[k]]};';
//			console.log(query);
		} else {
			// var colas = col.as;
			var colas = col.as;
			if(colas === undefined) {
			 	if(col instanceof yy.Column){
			 		colas = escapeq(col.columnid);
			 	} else {
			 		colas = col.nick;
			 	}
			}
			query.groupColumns[colas]=col.nick;

/*			if(typeof colas == 'undefined') {
				if(col instanceof yy.Column) {
					colas = col.columnid;
				} else {
					colas = col.toString();
					for(var i=0;i<idx;i++) {
						if(colas == self.columns[i].as) {
							colas = self.columns[i].as+':'+idx;
							break;
						}
					}
					col.as = colas;
				}
			}
*/
//			if(col.as) {
			s += 'r[\''+colas+'\']=';
			// } else {
			// 	s += 'r[\''+escapeq()+'\']=';
			// };
			// s += ';';
//			console.log(col);//,col.toJS('g',''));


 			s += n2u(col.toJS('g',''))+';';				
/*
			s += 'g[\''+col.nick+'\'];';

*/
			// if(col instanceof yy.Column) {
			// 	s += 'g[\''+col.columnid+'\'];';
			// } else {
//				s += 'g[\''+col.toString()+'\'];';

//				console.log(col);
				// var kg = col.toJS('g','')+';';				
				// for(var i=0;i<query.removeKeys.length;i++) {
				// 	// THis part should be intellectual
				// 	if(query.removeKeys[i] == colas) {
				// s += 'g[\''+colas+'\'];';
				// 		break;
				// 	}
				// };
				// s += kg;
//				console.log(s);
			// }
//			s += col.toJS('g','')+';';
//console.log(colas,query.removeKeys);
			for(var i=0;i<query.removeKeys.length;i++) {
				// THis part should be intellectual
				if(query.removeKeys[i] === colas) {
					query.removeKeys.splice(i,1);
					break;
				}
			}
		}
	});
	// return new Function('g,params,alasql',s+'return r');
	return s;
}

yy.Select.prototype.compileSelectGroup2 = function(query) {
	var s = query.selectgfns;
//	console.log('selectg:',s);
	return new Function('g,params,alasql','var y;'+s+'return r');
};

// SELECY * REMOVE [COLUMNS] col-list, LIKE ''
yy.Select.prototype.compileRemoveColumns = function(query) {
	var self = this;
	if(typeof this.removecolumns !== 'undefined') {
		query.removeKeys = query.removeKeys.concat(
			this.removecolumns.filter(function (column) {
				return (typeof column.like === 'undefined');
			}).map(function(column){return column.columnid}));

//console.log(query.removeKeys,this.removecolumns);				
		query.removeLikeKeys = this.removecolumns.filter(function (column) {
				return (typeof column.like !== 'undefined');
			}).map(function(column){
//				return new RegExp((column.like.value||'').replace(/\%/g,'.*').replace(/\?|_/g,'.'),'g');
				return column.like.value;
			});
	}
};


yy.Select.prototype.compileHaving = function(query) {
	if(this.having) {
		s = this.having.toJS('g',-1);
		query.havingfns = s;
//		console.log(s);
		return new Function('g,params,alasql','var y;return '+s);
	} else return function(){return true};
};

yy.Select.prototype.compileOrder = function (query) {
	var self = this;
	if(this.order) {
//			console.log(990, this.order);
		if(this.order && this.order.length == 1 && this.order[0].expression 
			 && typeof this.order[0].expression == "function") {
//			console.log(991, this.order[0]);
			var func = this.order[0].expression;
//			console.log(994, func);
			return function(a,b){
				var ra = func(a),rb = func(b);
				if(ra>rb) return 1;
				if(ra==rb) return 0;
				return -1;
			}
		};

		var s = '';
		var sk = '';
		this.order.forEach(function(ord,idx){
			// console.log(ord instanceof yy.Expression);
			// console.log(ord.toJS('a',''));
			// console.log(ord.expression instanceof yy.Column);
			
			// Date conversion
			var dg = ''; 
//console.log(ord.expression, ord.expression instanceof yy.NumValue);
			if(ord.expression instanceof yy.NumValue) {
				ord.expression = self.columns[ord.expression.value-1];
//console.log(ord.expression);
				ord.expression = new yy.Column({columnid:ord.expression.nick});
			};

			if(ord.expression instanceof yy.Column) {
				var columnid = ord.expression.columnid; 
				if(query.xcolumns[columnid]) {
					var dbtypeid = query.xcolumns[columnid].dbtypeid;
					if( dbtypeid == 'DATE' || dbtypeid == 'DATETIME') dg = '.valueOf()';
					// TODO Add other types mapping
				} else {
					if(alasql.options.valueof) dg = '.valueOf()'; // TODO Check
				}
				// COLLATE NOCASE
				if(ord.nocase) dg += '.toUpperCase()';

				s += 'if((a[\''+columnid+"']||'')"+dg+(ord.direction == 'ASC'?'>':'<')+'(b[\''+columnid+"']||'')"+dg+')return 1;';
				s += 'if((a[\''+columnid+"']||'')"+dg+'==(b[\''+columnid+"']||'')"+dg+'){';

			} else {
				dg = '.valueOf()';
				// COLLATE NOCASE
				if(ord.nocase) dg += '.toUpperCase()';
				s += 'if(('+ord.toJS('a','')+"||'')"+dg+(ord.direction == 'ASC'?'>(':'<(')+ord.toJS('b','')+"||'')"+dg+')return 1;';
				s += 'if(('+ord.toJS('a','')+"||'')"+dg+'==('+ord.toJS('b','')+"||'')"+dg+'){';
			}			

//			if(columnid == '_') {
//				s += 'if(a'+dg+(ord.direction == 'ASC'?'>':'<')+'b'+dg+')return 1;';
//				s += 'if(a'+dg+'==b'+dg+'){';
//			} else {
			// TODO Add date comparision
				// s += 'if(a[\''+columnid+"']"+dg+(ord.direction == 'ASC'?'>':'<')+'b[\''+columnid+"']"+dg+')return 1;';
				// s += 'if(a[\''+columnid+"']"+dg+'==b[\''+columnid+"']"+dg+'){';
//			}
			sk += '}';
		});
		s += 'return 0;';
		s += sk+'return -1';
		query.orderfns = s;
//console.log('ORDERBY',s);
		return new Function('a,b','var y;'+s);
	};
};


// Pivot functions
/**
	Compile Pivot functions
	@param {object} query Source query
	@return {function} Pivoting functions
*/
yy.Select.prototype.compilePivot = function (query) {
	/** @type {string} Main pivoting column */
	var columnid = this.pivot.columnid;


	return function(data){
		/** @type {object} Collection of grouped records */
		var gx = {};
		/** @type {array} Array of grouped records */
		var gr = [];

		/** For each row in data array */
		for(var i=0,ilen=data.length;i<ilen;i++) {
			var r = data[i];
			var q = g[r[columnid]];  // Take 
			if(q === undefined) {
				q = g[r[columnid]] = clone(r);
				delete q[columnid];
				gr.push(q);
			};
			if(r[columnid]) {
				gfn(r,q,query.params,alasql);
			}
			q[r[columnid]] = arrfn(r);

		}
	};






if(false) {
	/** @type {array} Array of values for pivoting */
	var als = {};
	var s = 'var z;if(['+this.pivot.inlist.map(function(ie){
		var v;
		if(ie.expr instanceof yy.Column) {
			v = "'"+ie.expr.columnid+"'";
		} else if(ie.expr instanceof yy.StringValue) {
			return ie.expr.value;
		} else {
			return ie.expr.toJS();
		}
		if(ie.as) {
			als[v] = ie.as;
		} else {
			als[v] = v
		}
		return "'"+v+"'";
	}).join(',')+'].indexOf(r[\''+columnid+'\'])>-1){z=r[\''+columnid+'\'];';
	s += 'g[z] = (g[z]||0)+1;';
	s += '}';
console.log(this.pivot.expr.toJS());
	console.log(this.pivot);
	console.log(s);
	var gfn = new Function('g,r,params,alasql','var y;'+s);

	return function(data){
		var g = {}, gr = [];
		for(var i=0,ilen=data.length;i<ilen;i++) {
			var r = data[i];
			var q = g[r[columnid]];
			if(q === undefined) {
				q = g[r[columnid]] = clone(r);
				delete q[columnid];
				gr.push(q);
			};
			if(r[columnid]) {
				gfn(r,q,query.params,alasql);
			}
			q[r[columnid]] = arrfn(r);

		}
	};
}
};


/**
	Compile UNPIVOT clause
	@param {object} query Query object
	@return {function} Function for unpivoting
*/
yy.Select.prototype.compileUnpivot = function (query) {
	console.log(93, query.columns);

};

/*
//
// ROLLUP(), CUBE(), GROUPING SETS() for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

/** 
 Calculate ROLLUP() combination
 */

var rollup = function (a,query) {
	var rr = [];
	var mask = 0;
	var glen = a.length;
	for(var g=0;g<glen+1;g++) {
		var ss = [];
		for(var i=0;i<glen;i++) {
		 	if(a[i] instanceof yy.Column) {
				a[i].nick = escapeq(a[i].columnid);

		 		query.groupColumns[escapeq(a[i].columnid)] = a[i].nick;
				var aaa = a[i].nick+'\t'
					+a[i].toJS('p',query.sources[0].alias,query.defcols);
		 	} else {
		 		query.groupColumns[escapeq(a[i].toString())] = escapeq(a[i].toString());
				var aaa = escapeq(a[i].toString())+'\t'
					+a[i].toJS('p',query.sources[0].alias,query.defcols);
			}

			if(mask&(1<<i)) ss.push(aaa);
		}
		rr.push(ss);
		mask = (mask<<1)+1; 
	};
	return rr;
};

/**
 Calculate CUBE()
 */
var cube = function (a,query) {
	var rr = [];
	var glen = a.length;
	for(var g=0;g<(1<<glen);g++) {
		var ss = [];
		for(var i=0;i<glen;i++) {
			if(g&(1<<i)) //ss.push(a[i]);
				//ss = cartes(ss,decartes(a[i]));

//				var aaa = a[i].toString()+'\t'
//					+a[i].toJS('p',query.sources[0].alias,query.defcols);

				ss = ss.concat(decartes(a[i],query));
				//
		}
		rr.push(ss);
	}
	return rr;
}

/**
 GROUPING SETS()
 */
var groupingsets = function(a,query) {
	return a.reduce(function(acc,d){
		acc = acc.concat(decartes(d,query));
		return acc;
	}, []);
}

/**
 Cartesian production
 */
var cartes = function(a1,a2){
	var rrr =[];
	for(var i1=0;i1<a1.length;i1++) {
		for(var i2=0;i2<a2.length;i2++) {
			rrr.push(a1[i1].concat(a2[i2]));
		}
	};
	return rrr;
}

/**
 Prepare groups function
 */
function decartes(gv,query) {
//	console.log(gv);
	if(gv instanceof Array) {
		var res = [[]];
		for(var t=0; t<gv.length; t++) {
			if(gv[t] instanceof yy.Column) {
			//	console.log('+++',gv[t].columnid,gv[t]);
				gv[t].nick = escapeq(gv[t].columnid);
			 	query.groupColumns[gv[t].nick] = gv[t].nick;
		 		res = res.map(function(r){return r.concat(gv[t].nick+'\t'+gv[t].toJS('p',query.sources[0].alias,query.defcols))}); 	
//		 		res = res.map(function(r){return r.concat(gv[t].columnid)}); 	
			} else if(gv[t] instanceof yy.FuncValue) {
				query.groupColumns[escapeq(gv[t].toString())] = escapeq(gv[t].toString());
		 		res = res.map(function(r){return r.concat(escapeq(gv[t].toString())+'\t'+gv[t].toJS('p',query.sources[0].alias,query.defcols))}); 	
		 		// to be defined
			} else if(gv[t] instanceof yy.GroupExpression) {
				if(gv[t].type == 'ROLLUP') res = cartes(res,rollup(gv[t].group,query));
				else if(gv[t].type == 'CUBE') res = cartes(res,cube(gv[t].group,query));
				else if(gv[t].type == 'GROUPING SETS') res = cartes(res,groupingsets(gv[t].group,query));
				else throw new Error('Unknown grouping function');
			} else if(gv[t] === '') {
//				console.log('+++');
				res = [['1\t1']];
			} else {
//				if(gv[t])
//				console.log('>'+gv[t]+'<',gv[t]=='',typeof gv[t]);
//				console.log(gv[t].toString());
//console.log('+++');
		 		res = res.map(function(r){
 					query.groupColumns[escapeq(gv[t].toString())] = escapeq(gv[t].toString());
		 			return r.concat(escapeq(gv[t].toString())
		 				+'\t'
		 				+gv[t].toJS('p',query.sources[0].alias,query.defcols)) 
		 		}); 	
//				res = res.concat(gv[t]);
			};

			// switch(gv[t].t) {
			// 	case 'plain': 
			// 		res = res.map(function(r){return r.concat(gv[t].p)}); 

			// 	break; 
			// 	case 'rollup': res = cartes(res,rollup(gv[t].p)); break; 
			// 	case 'cube': res = cartes(res,cube(gv[t].p)); break; 
			// 	case 'groupingsets': res = cartes(res,groupingsets(gv[t].p)); break; 
			// 	default: res = res.concat(gv[t]);
			// }
		};
		return res;
	} else if(gv instanceof yy.FuncValue) {
//		console.log(gv);
		query.groupColumns[escapeq(gv.toString())] = escapeq(gv.toString());
		return [gv.toString()+'\t'+gv.toJS('p',query.sources[0].alias,query.defcols)];
	} else if(gv instanceof yy.Column) {
			gv.nick = escapeq(gv.columnid);
		 	query.groupColumns[gv.nick] = gv.nick;
			return [gv.nick+'\t'+gv.toJS('p',query.sources[0].alias,query.defcols)]; // Is this ever happened?
		// } else if(gv instanceof yy.Expression) {
		// 	return [gv.columnid]; // Is this ever happened?
	} else {
		query.groupColumns[escapeq(gv.toString())] = escapeq(gv.toString());
		return [escapeq(gv.toString())+'\t'+gv.toJS('p',query.sources[0].alias,query.defcols)];
//			throw new Error('Single argument in the group without array');			
	};


		// switch(gv.t) {
		// 	case 'plain': return gv.p; break;
		// 	case 'rollup': return rollup(gv.p); break; 
		// 	case 'cube': return cube(gv.p); break; 
		// 	case 'groupingsets':  return groupingsets(gv.p); break; 
		// 	default: return [gv];//return decartes(gv.p);
		// }
		// return gv;
};



/*
//
// Select run-time part for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

yy.Select.prototype.compileDefCols = function(query, databaseid) {
//	console.log('defcols');
	var defcols = {};
	if(this.from) {
		this.from.forEach(function(fr){
			if(fr instanceof yy.Table) {
				var alias = fr.as || fr.tableid;
//				console.log(alasql.databases[fr.databaseid || databaseid]);
//				console.log(alasql.databases[fr.databaseid || databaseid].tables, fr.tableid);
//console.log(alasql.databases[fr.databaseid || databaseid].tables, fr.tableid);
//console.log(alasql.databases);
				var table = alasql.databases[fr.databaseid || databaseid].tables[fr.tableid];
//console.log(table);
				if(table.columns) {
					table.columns.forEach(function(col){
						if(defcols[col.columnid]) {
							defcols[col.columnid] = '-'; // Ambigous
						} else {
							defcols[col.columnid] = alias;
						}
					});
				}
			} else if(fr instanceof yy.Select) {

			} else if(fr instanceof yy.Search) {

			} else if(fr instanceof yy.ParamValue) {

			} else if(fr instanceof yy.VarValue) {

			} else if(fr instanceof yy.FuncValue) {

			} else if(fr instanceof yy.FromData) {

			} else if(fr instanceof yy.Json) {

			} else {
//				console.log(fr);
				throw new Error('Unknown type of FROM clause');
			};
		});
	};

	if(this.joins) {
		this.joins.forEach(function(jn){
//			console.log(jn);
			if(jn.table) {
				var alias = jn.table.tableid;
				if(jn.as) alias = jn.as;
				var alias = jn.as || jn.table.tableid;
				var table = alasql.databases[jn.table.databaseid || databaseid].tables[jn.table.tableid];
//				console.log(jn.table.tableid, jn.table.databaseid);
				if(table.columns) {
					table.columns.forEach(function(col){
						if(defcols[col.columnid]) {
							defcols[col.columnid] = '-'; // Ambigous
						} else {
							defcols[col.columnid] = alias;
						}
					});
				}
			} else if(jn.select) {

			} else if(jn.param) {

			} else if(jn.func) {

			} else {
				throw new Error('Unknown type of FROM clause');
			};
		});
	};
	// for(var k in defcols) {
	// 	if(defcols[k] == '-') defcols[k] = undefined;
	// }
//	console.log(defcols);
	return defcols;
}
/*
//
// UNION for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

// SELECT UNION statement

yy.Union = function (params) { return yy.extend(this, params); }
yy.Union.prototype.toString = function () {
	return 'UNION';
};

yy.Union.prototype.compile = function (tableid) {
	return null;
};
/*
//
// CROSS AND OUTER APPLY for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

yy.Apply = function (params) { 
	return yy.extend(this, params); 
}

yy.Apply.prototype.toString = function () {
	var s = this.applymode+' APPLY ('+this.select.toString()+')';
	
	if(this.as) 
		s += ' AS '+this.as;
	
	return s;
};



/*
//
// CROSS AND OUTER APPLY for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

yy.Over = function (params) { return yy.extend(this, params); }
yy.Over.prototype.toString = function () {
	var s = 'OVER (';
	if(this.partition) {
		s += 'PARTITION BY '+this.partition.toString();
		if(this.order) s+=' ';
	}
	if(this.order) {
		s += 'ORDER BY '+this.order.toString();
	}
	s += ')';
	return s;
};



/*
//
// Expressions for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

/**
  	Expression statement ( = 2*2; )
  	@class 
	@param {object} params Initial parameters
*/
yy.ExpressionStatement = function(params) { return yy.extend(this, params); };

/**
	Convert AST to string
	@this ExpressionStatement
	@return {string}
*/
yy.ExpressionStatement.prototype.toString = function() {
	return this.expression.toString();
};
/**
	Execute statement
	@param {string} databaseid Database identificatro
	@param {object} params Statement parameters
	@param {statement-callback} cb Callback
	@return {object} Result value
*/
yy.ExpressionStatement.prototype.execute = function (databaseid, params, cb) {
	if(this.expression) {
//		console.log(this.expression.toJS('','', null));
//		console.log(this.expression.toJS('','', null));
//        console.log(this.expression.toJS('({})','', null));

		alasql.precompile(this,databaseid,params); // Precompile queries
		var exprfn =  new Function("params,alasql,p",'var y;return '+this.expression.toJS('({})','', null)).bind(this);
		var res = exprfn(params,alasql);
		if(cb) {
			res = cb(res);
		}
		return res;
	}
};

/**
	Expression class
	@class
	@param {object} params Initial parameters
*/

yy.Expression = function(params) { return yy.extend(this, params); };

/**
	Convert AST to string
	@this ExpressionStatement
	@return {string}
*/
yy.Expression.prototype.toString = function() {
	var s = this.expression.toString();
	if(this.order) {
		s += ' '+this.order.toString();
	}
	if(this.nocase) {
		s += ' COLLATE NOCASE';
	}
	return s;
};

/**
	Find aggregator in AST subtree
	@this ExpressionStatement
	@param {object} query Query object
*/
yy.Expression.prototype.findAggregator = function (query){
	if(this.expression.findAggregator) {
		this.expression.findAggregator(query);
	}
};

/**
	Convert AST to JavaScript expression
	@this ExpressionStatement
	@param {string} context Context string, e.g. 'p','g', or 'x'
	@param {string} tableid Default table name
	@param {object} defcols Default columns dictionary
	@return {string} JavaScript expression
*/

yy.Expression.prototype.toJS = function(context, tableid, defcols) {
//	console.log('Expression',this);
	if(this.expression.reduced) {
		return 'true';
	}
	return this.expression.toJS(context, tableid, defcols);
};

/**
	Compile AST to JavaScript expression
	@this ExpressionStatement
	@param {string} context Context string, e.g. 'p','g', or 'x'
	@param {string} tableid Default table name
	@param {object} defcols Default columns dictionary
	@return {string} JavaScript expression
*/

yy.Expression.prototype.compile = function(context, tableid, defcols){
//	console.log('Expression',this);
	if(this.reduced) {
		return returnTrue();
	}
	return new Function('p','var y;return '+this.toJS(context, tableid, defcols));
};

/**
	JavaScript class
	@class
*/
yy.JavaScript = function(params) { return yy.extend(this, params); };
yy.JavaScript.prototype.toString = function() {
	var s = '``'+this.value+'``';
	return s;
};

yy.JavaScript.prototype.toJS = function( /* context, tableid, defcols*/ ) {
//	console.log('Expression',this);
	return '('+this.value+')';
};
yy.JavaScript.prototype.execute = function (databaseid, params, cb) {
	var res = 1;
	var expr =  new Function("params,alasql,p",this.value);
	expr(params,alasql);
	if(cb){
		res = cb(res);
	}
	return res;
};


/**
	Literal class
	@class
	@example
	MyVar, [My vairable], `MySQL variable`
*/

yy.Literal = function (params) { return yy.extend(this, params); };
yy.Literal.prototype.toString = function() {
	var s = this.value;
	if(this.value1){
		s = this.value1+'.'+s; 
	}
//	else s = tableid+'.'+s;
	return s;
};

/**
	Join class
	@class
*/

yy.Join = function (params) { return yy.extend(this, params); };
yy.Join.prototype.toString = function() {
	var s = ' ';
	if(this.joinmode){
		s += this.joinmode+' ';
	}
	s += 'JOIN ' + this.table.toString();
	return s;
};

//yy.Join.prototype.toJS = function(context, tableid) {
//	return 'JOIN'+this.table.toString();
//}

/**
	Table class
	@class
*/

yy.Table = function (params) { return yy.extend(this, params); };
yy.Table.prototype.toString = function() {
	var s = this.tableid;
//	if(this.joinmode)
	if(this.databaseid){
		s = this.databaseid+'.'+s;
	}
	return s;
};

/**
	View class
	@class
*/

yy.View = function (params) { return yy.extend(this, params); };
yy.View.prototype.toString = function() {
	var s = this.viewid;
//	if(this.joinmode)
	if(this.databaseid){
		s = this.databaseid+'.'+s;
	}
	return s;
};

/**
	Binary operation class
	@class
*/
yy.Op = function (params) { return yy.extend(this, params); };
yy.Op.prototype.toString = function() {
	if(this.op === 'IN' || this.op === 'NOT IN') {
		return this.left.toString()+" "+this.op+" ("+this.right.toString()+")";
	}
	if(this.allsome) {
		return this.left.toString()+" "+this.op+" "+this.allsome+' ('+this.right.toString()+')';
	}
	if(this.op === '->' || this.op === '!') {
		var s = this.left.toString()+this.op;
//		console.log(this.right);
		
		if(typeof this.right !== 'string' && typeof this.right !== 'number' ){
			s += '(';
		}
		
		s += this.right.toString();
		
		if(typeof this.right !== 'string' && typeof this.right !== 'number' ){
			s += ')';
		}
		
		return s;
	}
	return 	this.left.toString() + " " + this.op + " " +
			(this.allsome ? this.allsome+' ' : '') +
			this.right.toString();
};

yy.Op.prototype.findAggregator = function (query){
//	console.log(this.toString());
	if(this.left && this.left.findAggregator){
		this.left.findAggregator(query);
	}
	// Do not go in > ALL
	if(this.right && this.right.findAggregator && (!this.allsome)) {
		this.right.findAggregator(query);
	}
};

yy.Op.prototype.toType = function(tableid) {
	if(['-','*','/','%','^'].indexOf(this.op) >-1){
		return 'number';
	}
	if(this.op === '+') {
		if(this.left.toType(tableid) === 'string' || this.right.toType(tableid) === 'string'){
			return 'string';
		}
		if(this.left.toType(tableid) === 'number' || this.right.toType(tableid) === 'number'){ 
			return 'number';
		}
	}
	
	if(['AND','OR','NOT','=','==','===', '!=','!==','!===','>','>=','<','<=', 'IN', 'NOT IN', 'LIKE', 'NOT LIKE', 'REGEXP'].indexOf(this.op) >-1 ){
		return 'boolean';
	}

	if(this.op === 'BETWEEN' || this.op === 'NOT BETWEEN' || this.op === 'IS NULL' || this.op === 'IS NOT NULL'){
		return 'boolean';
	}
	
	if(this.allsome){
		return 'boolean';
	}

	if(!this.op){
		return this.left.toType();
	}

	return 'unknown';
};

yy.Op.prototype.toJS = function(context,tableid,defcols) {
//	console.log(this);
	var s;
	var op = this.op;
	var _this = this;
	var leftJS = function(){return _this.left.toJS(context,tableid, defcols)};
	var rightJS = function(){return _this.right.toJS(context,tableid, defcols)};

	if(this.op === '='){
		op = '===';
	} else if(this.op === '<>'){
		op = '!=';
	} else if(this.op === 'OR'){
		op = '||';
	}

	// Arrow operator
	if(this.op === '->') {
		// Expression to prevent error if object is empty (#344)
		var ljs = '('+leftJS()+'||{})';

		if(typeof this.right === "string") {
			return ljs +'["'+this.right+'"]';
		
		} else if(typeof this.right === "number") {
			return ljs+'['+this.right+']';
		
		} else if(this.right instanceof yy.FuncValue) {
			var ss = [];
			if(!(!this.right.args || 0 === this.right.args.length)) {
				var ss = this.right.args.map(function(arg){
					return arg.toJS(context,tableid, defcols);
				});
			}
			return 	''
					+ ljs
					+ "['"
					+ 	this.right.funcid
					+ "']("
					+ 	ss.join(',')
					+ ')'; 
		} else {

			return 	''
					+ ljs
					+ '['
					+	rightJS()
					+ ']';
		}
	}

	if(this.op === '!') {
		if(typeof this.right === "string") {
			return 	''
					+ 'alasql.databases[alasql.useid].objects['
					+ 	leftJS()
					+ ']["'
					+	this.right
					+ '"]';
		}		
		// TODO - add other cases
	}

	if(this.op === 'IS') {
		return 	''
				+ '('
				+	'(typeof ' + leftJS()  + "==='undefined')"
				+	" === "
				+	'(typeof ' + rightJS() + "==='undefined')"
				+ ')';
	}


	if(this.op === '==') {
		return 	''
				+ 'alasql.utils.deepEqual('
				+	leftJS()
				+ 	','
				+ 	rightJS()
				+ ')';
	}


	if(this.op === '===' || this.op === '!===') {
		return 	''
				+ '('
				+ 	( (this.op === '!===') ? '!' : '')
				+	'('
				+		'(' + leftJS() + ").valueOf()"
				+ 		'==='
				+ 		'(' + rightJS() + ").valueOf()"
				+ 	')'
				+ ')';
		
	}


	if(this.op === '!==') {
		return 	''
				+ '(!alasql.utils.deepEqual('
				+ 	leftJS()
				+ 	","
				+ 	rightJS()
				+ '))';
	}
	if(this.op === 'LIKE' || this.op === 'NOT LIKE') {
		var s = '('
				+ 	( (this.op === 'NOT LIKE') ? '!' : '')
				+ 	'alasql.utils.like(' + rightJS()+ "," + leftJS();
		if(this.escape) {
			s += ','+this.escape.toJS(context,tableid, defcols);
		}
		s += '))';
		return s;
	}
	if(this.op === 'REGEXP') {
		return 'alasql.stdfn.REGEXP_LIKE(' 
			+ leftJS()
			+ ','
			+ rightJS()
			+ ')';
	}

	if(this.op === 'BETWEEN' || this.op === 'NOT BETWEEN') {
		return 	''
				+ '('
				+ 	( (this.op === 'NOT BETWEEN') ? '!' : '')
				+ 	'('
				+ 		'('
				+ 			this.right1.toJS(context,tableid, defcols)
				+			'<='
				+			leftJS()
				+		') && ('
				+			leftJS()
				+			'<='
				+			this.right2.toJS(context,tableid, defcols)
				+		')'
				+ 	')'		
				+ ')';		

/*
		if(this.right instanceof yy.Op && this.right.op == 'AND') {

			return '(('+this.right.left.toJS(context,tableid, defcols)+'<='+leftJS()+')&&'+
			'('+leftJS()+'<='+this.right.right.toJS(context,tableid, defcols)+'))';		

		} else {
			throw new Error('Wrong BETWEEN operator without AND part');
		}
*/
	}

	

	if(this.op === 'IN') {
		if(this.right instanceof yy.Select ) {
			s = '(';
//			s += 'this.query.queriesdata['+this.queriesidx+']';
//			s += 'alasql.utils.flatArray(this.query.queriesfn['+(this.queriesidx)+'](params,null,context))';
			s += 'alasql.utils.flatArray(this.queriesfn['+(this.queriesidx)+'](params,null,context))';
			s += '.indexOf(';
			s += leftJS()+')>-1)';
			return s;
		} else if(this.right instanceof Array ) {
//			if(this.right.length == 0) return 'false';
			s 	= '(['
				+ this.right.map(function(a){return a.toJS(context,tableid, defcols);}).join(',')
				+ '].indexOf('
				+ leftJS()
				+ ')>-1)';
//console.log(s);
			return s;
		} else {
			s = '('+rightJS()+'.indexOf('
			  	+ leftJS()+')>-1)';
//console.log('expression',350,s);
			return s;
//		} else {
//			throw new Error('Wrong IN operator without SELECT part');
		}
	}


	if(this.op === 'NOT IN') {
		if(this.right instanceof yy.Select ) {
			s = '(';
				//this.query.queriesdata['+this.queriesidx+']
//			s += 'alasql.utils.flatArray(this.query.queriesfn['+(this.queriesidx)+'](params,null,p))';
			s += 'alasql.utils.flatArray(this.queriesfn['+(this.queriesidx)+'](params,null,p))';
			s +='.indexOf(';
			s += leftJS()+')<0)';
			return s;
		} else if(this.right instanceof Array ) {
//			if(this.right.length == 0) return 'true';
			s = '(['+this.right.map(function(a){return a.toJS(context,tableid, defcols);}).join(',')+'].indexOf(';
			s += leftJS()+')<0)';
			return s;
		} else {
			s = '('+rightJS()+'.indexOf(';
			s += leftJS()+')==-1)';
			return s;

//			throw new Error('Wrong NOT IN operator without SELECT part');
		}
	}

	if(this.allsome === 'ALL') {
		var s;
		if(this.right instanceof yy.Select ) {
//			var s = 'this.query.queriesdata['+this.queriesidx+']';
		 	s = 'alasql.utils.flatArray(this.query.queriesfn['+(this.queriesidx)+'](params,null,p))';

			s +='.every(function(b){return (';
			s += leftJS()+')'+op+'b})';
			return s;
		} else if(this.right instanceof Array ) {
			s = '['+this.right.map(function(a){return a.toJS(context,tableid, defcols);}).join(',')+'].every(function(b){return (';
			s += leftJS()+')'+op+'b})';
			return s;
		} else {
			throw new Error('NOT IN operator without SELECT');
		}		
	}

	if(this.allsome === 'SOME' || this.allsome === 'ANY') {
		var s;
		if(this.right instanceof yy.Select ) {
//			var s = 'this.query.queriesdata['+this.queriesidx+']';
			s = 'alasql.utils.flatArray(this.query.queriesfn['+(this.queriesidx)+'](params,null,p))';
			s +='.some(function(b){return (';
			s += leftJS()+')'+op+'b})';
			return s;
		} else if(this.right instanceof Array ) {
			s = '['+this.right.map(function(a){return a.toJS(context,tableid, defcols);}).join(',')+'].some(function(b){return (';
			s += leftJS()+')'+op+'b})';
			return s;
		} else {
			throw new Error('SOME/ANY operator without SELECT');
		}		
	}

// Special case for AND optimization (if reduced)
	if(this.op === 'AND') {
		if(this.left.reduced) {
			if(this.right.reduced) {
				return 'true';
			} else {
				return rightJS();
			}
		} else if(this.right.reduced) {
			return leftJS();
		}			

		// Otherwise process as regular operation (see below)
		op = '&&';

	}

	if(this.op === '^') {
		return 	'Math.pow('
				+ leftJS()
				+ ','
				+ rightJS()
				+ ')';
	}




	// Change names
//	console.log(this);
	return 	''
			+ '('
			+ leftJS()
			+ op
			+ rightJS()
			+ ')';
}


yy.VarValue = function (params) { return yy.extend(this, params); }
yy.VarValue.prototype.toString = function() {
	return '@'+this.variable;
};

yy.VarValue.prototype.toType = function() {
	return 'unknown';
};

yy.VarValue.prototype.toJS = function() {
	return "alasql.vars['"+this.variable+"']";
}


yy.NumValue = function (params) { return yy.extend(this, params); }
yy.NumValue.prototype.toString = function() {
	return this.value.toString();
};

yy.NumValue.prototype.toType = function() {
	return 'number';
};

yy.NumValue.prototype.toJS = function() {
	return ""+this.value;
}




yy.StringValue = function (params) { return yy.extend(this, params); }
yy.StringValue.prototype.toString = function() {
	return "'"+this.value.toString()+"'";
}

yy.StringValue.prototype.toType = function() {
	return 'string';
}

yy.StringValue.prototype.toJS = function() {
//	console.log("'"+doubleqq(this.value)+"'");
//	return "'"+doubleqq(this.value)+"'";
	return "'"+escapeq(this.value)+"'";

}


yy.LogicValue = function (params) { return yy.extend(this, params); }
yy.LogicValue.prototype.toString = function() {
	return this.value?'TRUE':'FALSE';
}

yy.LogicValue.prototype.toType = function() {
	return 'boolean';
}

yy.LogicValue.prototype.toJS = function() {
	return this.value?'true':'false';
}

yy.NullValue = function (params) { return yy.extend(this, params); }
yy.NullValue.prototype.toString = function() {
	return 'NULL';
}
yy.NullValue.prototype.toJS = function() {
	return 'undefined';
//	return 'undefined';
}

yy.ParamValue = function (params) { return yy.extend(this, params); }
yy.ParamValue.prototype.toString = function() {
	return '$'+this.param;
}
yy.ParamValue.prototype.toJS = function() {
	if(typeof this.param === "string"){
		return "params['"+this.param+"']";
	}
	
	return "params["+this.param+"]";
}



yy.UniOp = function (params) { return yy.extend(this, params); }
yy.UniOp.prototype.toString = function() {
	if(this.op === '-'){
		return this.op+this.right.toString();
	}
	
	if(this.op === '+'){
		return this.op+this.right.toString();
	}
	
	if(this.op === '#'){
		return this.op+this.right.toString();
	}

	if(this.op === 'NOT'){
		return this.op+'('+this.right.toString()+')';
	}
	
	// Please avoid === here
	if(this.op == null){						// jshint ignore:line
		return '('+this.right.toString()+')';
	}

	// todo: implement default case
};

yy.UniOp.prototype.findAggregator = function (query){
	if(this.right.findAggregator){
		this.right.findAggregator(query);
	}
};

yy.UniOp.prototype.toType = function() {
	if(this.op === '-'){
		return 'number';
	}

	if(this.op === '+'){
		return 'number';
	}

	if(this.op === 'NOT'){ 
		return 'boolean';
	}

	// Todo: implement default case
};

yy.UniOp.prototype.toJS = function(context, tableid, defcols) {
	if(this.op === '-'){
		return "(-("+this.right.toJS(context, tableid, defcols)+"))";
	}

	if(this.op === '+'){
		return "("+this.right.toJS(context, tableid, defcols)+")";
	}

	if(this.op === 'NOT'){
		return '!('+this.right.toJS(context, tableid, defcols)+')';
	}

	if(this.op === '#') {
		if(this.right instanceof yy.Column) {
			return "(alasql.databases[alasql.useid].objects[\'"+this.right.columnid+"\'])";
		} else {
			return "(alasql.databases[alasql.useid].objects["
				+this.right.toJS(context, tableid, defcols)+"])";
		}
	}

	// Please avoid === here	
	if(this.op == null){ 		// jshint ignore:line
		return '('+this.right.toJS(context, tableid, defcols)+')';
	}

	// Todo: implement default case.
};



// yy.Star = function (params) { return yy.extend(this, params); }
// yy.Star.prototype.toString = function() {
// 	var s = this.fieldid;
// 	if(this.tableid) {
// 		s = this.tableid+'.'+s;
// 		if(this.databaseid) {
// 			s = this.databaseid+'.'+s;
// 		}
// 	}
// 	if(this.alias) s += ' AS '+this.alias;
// 	return s;
// }

yy.Column = function(params) { return yy.extend(this, params); }
yy.Column.prototype.toString = function() {
	var s;
	if(this.columnid === +this.columnid) {
		s = '['+this.columnid+']';
	} else {
		s = this.columnid;
	}
	if(this.tableid) {
		if(+this.columnid === this.columnid) {
			s = this.tableid+s;
		} else {
			s = this.tableid+'.'+s;
		}
		if(this.databaseid) {
			s = this.databaseid+'.'+s;
		}
	}
//	if(this.alias) s += ' AS '+this.alias;
	return s;
};

yy.Column.prototype.toJS = function(context, tableid, defcols) {
//	var s = this.value;
// 	var s = this.columnid;
// 	if(this.tableid) {
// 		s = this.tableid+'.'+s;
// //		if(this.databaseid) {
// //			s = this.databaseid+'.'+s;
// //		}
// 	} else {
// 		s = tableid+'.'+s;
// 	}
//console.log('yy.Column',this, tableid);
//	console.log(392,this.columnid);

//console.log(506,this);

//console.log(523, arguments);

	var s = '';
	if(!this.tableid && tableid === '' && !defcols) {
		if(this.columnid !== '_') {
			s = context+'[\''+this.columnid+'\']';
		} else {
			if(context === 'g') {
				s = 'g[\'_\']';						
			} else {
				s = context;
			}
		}
	} else {
		if(context === 'g') {
			// if(this.columnid == '_') {
			// } else {
				s = 'g[\''+this.nick+'\']';						
			// }
		} else if(this.tableid) {
			if(this.columnid !== '_') {
				s = context+'[\''+(this.tableid) + '\'][\''+this.columnid+'\']';			
			} else {
				if(context === 'g') {
					s = 'g[\'_\']';						
				} else {
					s = context+'[\''+(this.tableid) + '\']';
				}
			}
		} else if(defcols) {
			var tbid = defcols[this.columnid];
			if(tbid === '-') {
				throw new Error('Cannot resolve column "'+this.columnid+'" because it exists in two source tables');
			} else if(tbid) {
				if(this.columnid !== '_') {
					s = context+'[\''+(tbid) + '\'][\''+this.columnid+'\']';
				} else {
					s = context+'[\''+(tbid) + '\']';
				}
			} else {
				if(this.columnid !== '_') {
					s = context+'[\''+(this.tableid || tableid) + '\'][\''+this.columnid+'\']';
				} else {
					s = context+'[\''+(this.tableid || tableid) + '\']';
				}
			}
		} else if(tableid === -1) {
//			if(this.columnid != '') {
				s = context+'[\''+this.columnid+'\']';
//			} else {
//				s = context;				
//			}
		} else {
			if(this.columnid !== '_') {
				s = context+'[\''+(this.tableid || tableid) + '\'][\''+this.columnid+'\']';
			} else {
				s = context+'[\''+(this.tableid || tableid) + '\']';
			}
		}
	}
//	console.log(context,s);
//	console.trace(new Error());
	return s;
}




yy.AggrValue = function(params){ return yy.extend(this, params); }
yy.AggrValue.prototype.toString = function() {
	var s = '';
	if(this.aggregatorid === 'REDUCE'){
		s += this.funcid+'(';
	} else{
		s += this.aggregatorid+'(';
	}

	if(this.distinct){
		s+= 'DISTINCT ';
	}

	if(this.expression){
		s += this.expression.toString();
	}

	s += ')';

	if(this.over){
		s += ' '+this.over.toString();
	} 
//	console.log(this.over);
//	if(this.alias) s += ' AS '+this.alias;
	return s;
};

yy.AggrValue.prototype.findAggregator = function (query){
//	console.log('aggregator found',this.toString());

//	var colas = this.as || this.toString();

	var colas = escapeq(this.toString())+':'+query.selectGroup.length;
//	console.log('findAgg',this);


/*	var found = false;
	for(var i=0;i<query.columns.length;i++) {
		// THis part should be intellectual
		if(query.columns[i].as == colas) {
			found = true;
			break;
		}
	}
*/	
//	if(!query.selectColumns[colas]) {
//	}

	var found = false;

/*	
	for(var i=0;i<query.selectGroup.length;i++){
		if(query.selectGroup[i].nick==colas) {
			colas = colas+':'+i;
			found = false;
			break;
		};
	};
*/
//	console.log("query.selectGroup",query.selectGroup,found);
	if(!found) {
		if(!this.nick) {
			this.nick = colas;
			var found = false;
			for(var i=0;i<query.removeKeys.length;i++){
				if(query.removeKeys[i]===colas) {
					found = true;
					break;
				}
			}
			if(!found){
				query.removeKeys.push(colas);
			}
		}
		query.selectGroup.push(this);
	}
//	console.log(query.selectGroup);


////	this.reduced = true;
	return;
};

yy.AggrValue.prototype.toType = function() {
	if(['SUM','COUNT','AVG','MIN', 'MAX','AGGR','VAR','STDDEV'].indexOf(this.aggregatorid)>-1){
		return 'number';
	}

	if(['ARRAY'].indexOf(this.aggregatorid)>-1){
		return 'array';
	}

	if(['FIRST','LAST' ].indexOf(this.aggregatorid)>-1){
		return this.expression.toType();
	}

	// todo: implement default;
}


yy.AggrValue.prototype.toJS = function(/*context, tableid, defcols*/) {
//	var s = 'alasql.functions.'+this.funcid+'(';
//	if(this.expression) s += this.expression.toJS(context, tableid);
//	s += ')';
//	if(this.alias) s += ' AS '+this.alias;
//	return s;
//	var s = ''; 
//if(this.as) console.log(499,this.as);
//	var colas = this.as;
	var colas = this.nick;
	if(colas === undefined){ 
		colas = this.toString();
	}
	return 'g[\''+colas+'\']';
}


yy.OrderExpression = function(params){ return yy.extend(this, params); }
yy.OrderExpression.prototype.toString = yy.Expression.prototype.toString
/* //Duplicated code

function() {
	var s = this.expression.toString();
	if(this.order) s += ' '+this.order.toString();
	if(this.nocase) s += ' '+'COLLATE'+' '+'NOCASE';
	return s;
}*/

yy.GroupExpression = function(params){ return yy.extend(this, params); }
yy.GroupExpression.prototype.toString = function() {
	return this.type+'('+this.group.toString()+')';
}


/* //Duplicated code
yy.ColumnDef = function (params) { return yy.extend(this, params); }
yy.ColumnDef.prototype.toString = function() {
	var s =  this.columnid;
	if(this.dbtypeid) s += ' '+this.dbtypeid;
	if(this.dbsize) {
		s += '('+this.dbsize;
		if(this.dbprecision) s += ','+this.dbprecision;
		s += ')';
	};
	if(this.primarykey) s += ' PRIMARY KEY';
	if(this.notnull) s += ' NOT NULL';
	return s;
}*/

// Alasql Linq library

yy.FromData = function(params) { return yy.extend(this, params); };
yy.FromData.prototype.toString = function() {
	if(this.data) return 'DATA('+((Math.random()*10e15)|0)+')';
	else return '?';
};
yy.FromData.prototype.toJS = function(){
//	console.log('yy.FromData.prototype.toJS');
};

yy.Select.prototype.exec = function(params,cb) {
	
	if(this.preparams) params = this.preparams.concat(params);
//	console.log(15,this.preparams);

	var databaseid = alasql.useid;
	db = alasql.databases[databaseid];
	var sql = this.toString();
	var hh = hash(sql);
//	console.log(sql);

	var statement = this.compile(databaseid);
	if(!statement) return;
	statement.sql = sql;
	statement.dbversion = db.dbversion;
	
	// Secure sqlCache size
	if (db.sqlCacheSize > alasql.MAXSQLCACHESIZE) {
		db.resetSqlCache();
	}
	db.sqlCacheSize++;
	db.sqlCache[hh] = statement;
	var res = alasql.res = statement(params, cb);
	return res;
};

yy.Select.prototype.Select = function(){
	var self = this;
	var agrs = [];
	if(arguments.length > 1) {
		args = Array.prototype.slice.call(arguments);;
	} else if(arguments.length == 1) {
		if(arguments[0] instanceof Array) {
			args = arguments[0];
		} else {
			args = [arguments[0]];
		}
	} else {
		throw new Error('Wrong number of arguments of Select() function');
	}

	self.columns = [];

	args.forEach(function(arg){
		if(typeof arg == "string") {
			self.columns.push(new yy.Column({columnid: arg}));
		} else if(typeof arg == "function") {
			var pari = 0;
			if(self.preparams) {
				pari = self.preparams.length;
			} else {
				self.preparams = [];
			}
			self.preparams.push(arg);
			self.columns.push(new yy.Column({columnid: "*", func:arg, param:pari}));
		} else {
			// Unknown type
		}
	});

//	console.log(self instanceof yy.Select);
	return self;
};

yy.Select.prototype.From = function(tableid){
	var self = this;
	if(!self.from) self.from = [];
	if(tableid instanceof Array) {
		var pari = 0;
		if(self.preparams) {
			pari = self.preparams.length;
		} else {
			self.preparams = [];
		}
		self.preparams.push(tableid); 
		self.from.push(new yy.ParamValue({param:pari}));
	} else if(typeof tableid =="string") {
		self.from.push(new yy.Table({tableid:tableid}));
	} else {
		throw new Error('Unknown arguments in From() function')
	}
	return self;
}

yy.Select.prototype.OrderBy = function(){
	var self = this;
	var agrs = [];

	self.order = [];

	if(arguments.length == 0) {
//		self.order.push(new yy.OrderExpression({expression: new yy.Column({columnid:"_"}), direction:'ASC'}));		
		args = ["_"];
	} else if(arguments.length > 1) {
		args = Array.prototype.slice.call(arguments);;
	} else if(arguments.length == 1) {
		if(arguments[0] instanceof Array) {
			args = arguments[0];
		} else {
			args = [arguments[0]];
		}
	} else {
		throw new Error('Wrong number of arguments of Select() function');
	}

	if(args.length > 0) {
		args.forEach(function(arg){
			var expr = new yy.Column({columnid:arg});
			if(typeof arg == 'function'){
				expr = arg;
			}
			self.order.push(new yy.OrderExpression({expression: expr, direction:'ASC'}));
		});
	}
	return self;
}

yy.Select.prototype.Top = function(topnum){
	var self = this;
	self.top = new yy.NumValue({value:topnum});
	return self;
};

yy.Select.prototype.GroupBy = function(){
	var self = this;
	var agrs = [];

	if(arguments.length > 1) {
		args = Array.prototype.slice.call(arguments);;
	} else if(arguments.length == 1) {
		if(arguments[0] instanceof Array) {
			args = arguments[0];
		} else {
			args = [arguments[0]];
		}
	} else {
		throw new Error('Wrong number of arguments of Select() function');
	}

	self.group = [];

	args.forEach(function(arg){
		var expr = new yy.Column({columnid:arg});
		self.group.push(expr);
	});

	return self;
};

yy.Select.prototype.Where = function(expr){
	var self = this;
	if(typeof expr == 'function' ) {
		self.where = expr;
	}
	return self;
};


/*
//
// Functions for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

yy.FuncValue = function(params){ return yy.extend(this, params); }
yy.FuncValue.prototype.toString = function() {
	var s = '';
    
    if(alasql.fn[this.funcid]) s += this.funcid;
    else if(alasql.aggr[this.funcid]) s += this.funcid;
    else if(alasql.stdlib[this.funcid.toUpperCase()] || alasql.stdfn[this.funcid.toUpperCase()]) s += this.funcid.toUpperCase();
    
    s += '(';
	if(this.args && this.args.length > 0) {
		s += this.args.map(function(arg){
			return arg.toString();
		}).join(',');
	};
	s += ')';
	if(this.as) s += ' AS '+this.as.toString();
//	if(this.alias) s += ' AS '+this.alias;
	return s;
}



yy.FuncValue.prototype.execute = function (databaseid, params, cb) {
	var res = 1;
	alasql.precompile(this,databaseid,params); // Precompile queries
//	console.log(34,this.toJS('','',null));
	var expr =  new Function('params,alasql','var y;return '+this.toJS('','',null));
	expr(params,alasql);
	if(cb) res = cb(res);
	return res;
}


//yy.FuncValue.prototype.compile = function(context, tableid, defcols){
//	console.log('Expression',this);
//	if(this.reduced) return returnTrue();
//	return new Function('p','var y;return '+this.toJS(context, tableid, defcols));
//};


// yy.FuncValue.prototype.compile = function(context, tableid, defcols){
// //	console.log('Expression',this);
// 	if(this.reduced) return returnTrue();
// 	return new Function('p','var y;return '+this.toJS(context, tableid, defcols));
// };

yy.FuncValue.prototype.findAggregator = function(query) {
	if(this.args && this.args.length > 0) {
		this.args.forEach(function(arg){ 
			if(arg.findAggregator) arg.findAggregator(query); 
		});
	}
};

yy.FuncValue.prototype.toJS = function(context, tableid, defcols) {
	var s = '';
    var funcid = this.funcid;
	// IF this is standard compile functions
	if(alasql.fn[funcid]) {
	// This is user-defined run-time function
	// TODO arguments!!!
//		var s = '';
		if(this.newid) s+= 'new ';
		s += 'alasql.fn.'+this.funcid+'(';
//		if(this.args) s += this.args.toJS(context, tableid);
		if(this.args && this.args.length > 0) {
			s += this.args.map(function(arg){
				return arg.toJS(context, tableid, defcols);
			}).join(',');
		};
		s += ')';
	} else if(alasql.stdlib[funcid.toUpperCase()]) {
		if(this.args && this.args.length > 0) {
			s += alasql.stdlib[funcid.toUpperCase()].apply(this, this.args.map(function(arg) {return arg.toJS(context, tableid)}));
		} else {
			s += alasql.stdlib[funcid.toUpperCase()]();
		}
	} else if(alasql.stdfn[funcid.toUpperCase()]) {
		if(this.newid) s+= 'new ';
		s += 'alasql.stdfn.'+this.funcid.toUpperCase()+'(';
//		if(this.args) s += this.args.toJS(context, tableid);
		if(this.args && this.args.length > 0) {
			s += this.args.map(function(arg){
				return arg.toJS(context, tableid, defcols);
			}).join(',');
		};
		s += ')';		
	} else {
		// Aggregator
	}
//console.log('userfn:',s,this);

//	if(this.alias) s += ' AS '+this.alias;
	return s;
}

// // Functions compiler
// nodes.FunctionValue.prototype.toJS = function (context, tableid) {
// 	var s = '';
// 	s += fns[this.name.toUpperCase()].apply(null,this.arguments.map(function(arg){
// 		if(arg) return arg.toJS(context, tableid);
// 		else return '';
// 	}));
// 	return s;
// };

// 
// SQL FUNCTIONS COMPILERS
// Based on SQLite functions

// IMPORTANT: These are compiled functions

//alasql.fn = {}; // Keep for compatibility
//alasql.userlib = alasql.fn; 

var stdlib = alasql.stdlib = {}
var stdfn = alasql.stdfn = {}

stdlib.ABS = function(a) {return 'Math.abs('+a+')'};
stdlib.CLONEDEEP = function(a) {return 'alasql.utils.cloneDeep('+a+')'};
stdlib.IIF = function(a,b,c) {
	if(arguments.length == 3) {
		return  '(('+a+')?('+b+'):('+c+'))';
	} else {
		throw new Error('Number of arguments of IFF is not equals to 3');
	};
};
stdlib.IFNULL = function(a,b) {return '('+a+'||'+b+')'};
stdlib.INSTR = function(s,p) {return '(('+s+').indexOf('+p+')+1)'};

//stdlib.LEN = stdlib.LENGTH = function(s) {return '('+s+'+"").length';};



stdlib.LEN = stdlib.LENGTH = function(s) {return und(s,'y.length');}
//stdlib.LENGTH = function(s) {return '('+s+').length'};

stdlib.LOWER = stdlib.LCASE = function(s) {return und(s,'y.toLowerCase()');}
//stdlib.LCASE = function(s) {return '('+s+').toLowerCase()';}


// LTRIM

stdlib.MAX = stdlib.GREATEST = function(){
      return 'Math.max('+Array.prototype.join.call(arguments, ',')+')'
};

stdlib.MIN = stdlib.LEAST = function(){
      return 'Math.min('+Array.prototype.join.call(arguments, ',')+')'
};

stdlib.SUBSTRING = stdlib.SUBSTR = stdlib.MID = function(a,b,c){
	if(arguments.length == 2) return und(a,'y.substr('+b+'-1)');
	else if(arguments.length == 3) return und(a,'y.substr('+b+'-1,'+c+')');
};

stdfn.REGEXP_LIKE = function(a,b,c) {
//	console.log(a,b,c);
	return (a||'').search(RegExp(b,c))>-1;
}

// Here we uses undefined instead of null
stdlib.ISNULL = stdlib.NULLIF = function(a,b){return '('+a+'=='+b+'?undefined:'+a+')'};

stdlib.POWER = function(a,b) {return 'Math.pow('+a+','+b+')'};

stdlib.RANDOM = function(r) {
	if(arguments.length == 0) {
		return 'Math.random()';
	} else {
		return '(Math.random()*('+r+')|0)';
	}
}
stdlib.ROUND = function(s,d) {
	if(arguments.length == 2) {
		return 'Math.round('+s+'*Math.pow(10,'+d+'))/Math.pow(10,'+d+')';
	} else {
		return 'Math.round('+s+')';
	}
}
stdlib.ROWNUM = function() {return '1'};
stdlib.ROW_NUMBER = function() {return '1'};

stdlib.SQRT = function(s) {return 'Math.sqrt('+s+')'};

stdlib.TRIM = function(s) {return und(s,'y.trim()');}

stdlib.UPPER = stdlib.UCASE = function(s) {return und(s,'y.toUpperCase()');}
//stdlib.UCASE = function(s) {return '('+s+').toUpperCase()';}
//REPLACE
// RTRIM
// SUBSTR
// TRIM
//REPLACE
// RTRIM
// SUBSTR
// TRIM


// Aggregator for joining strings
alasql.aggr.GROUP_CONCAT = function(v,s){
    if(typeof s == "undefined") return v; else return s+','+v;
};

// Median
alasql.aggr.MEDIAN = function(v,s,acc){
	// Init
	if(typeof acc.arr == 'undefined') {
	  acc.arr = [v];
	  return v; 
	// Pass
	} else {
	  acc.arr.push(v);
	  var p = acc.arr.sort();
	  return p[(p.length/2)|0];     
	};
};

// Standard deviation
alasql.aggr.VAR = function(v,s,acc){
	if(typeof acc.arr == 'undefined') {
		acc.arr = [v];
		acc.sum = v;
	} else {
		acc.arr.push(v);
		acc.sum += v;
	}
	var N = acc.arr.length;
	var avg = acc.sum / N;
	var std = 0;
	for(var i=0;i<N;i++) {
		std += (acc.arr[i]-avg)*(acc.arr[i]-avg);
	}
	std = std/(N-1);
	return std;
};

alasql.aggr.STDEV = function(v,s,acc){
	return Math.sqrt(alasql.aggr.VAR(v,s,acc));
}

// Standard deviation
alasql.aggr.VARP = function(v,s,acc){
	if(typeof acc.arr == 'undefined') {
		acc.arr = [v];
		acc.sum = v;
	} else {
		acc.arr.push(v);
		acc.sum += v;
	}
	var N = acc.arr.length;
	var avg = acc.sum / N;
	var std = 0;
	for(var i=0;i<N;i++) {
		std += (acc.arr[i]-avg)*(acc.arr[i]-avg);
	}
	std = std/N;
	return std;
};

alasql.aggr.STD = alasql.aggr.STDDEV = alasql.aggr.STDEVP = function(v,s,acc){
	return Math.sqrt(alasql.aggr.VARP(v,s,acc));
};







/*
//
// CASE for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

yy.CaseValue = function(params) { return yy.extend(this, params); };
yy.CaseValue.prototype.toString = function() {
	var s = 'CASE ';
	if(this.expression) s += this.expression.toString();
	if(this.whens) {
		s += this.whens.map(function(w) { return ' WHEN '+
			w.when.toString() + ' THEN '+w.then.toString()}).join();
	}
	s += ' END';
	return s;
};

yy.CaseValue.prototype.findAggregator = function (query){
//	console.log(this.toString());
	if(this.expression && this.expression.findAggregator) this.expression.findAggregator(query);
	if(this.whens && this.whens.length > 0) {
		this.whens.forEach(function(w) { 
			if(w.when.findAggregator) w.when.findAggregator(query);
			if(w.then.findAggregator) w.then.findAggregator(query);
		});
	};
	if(this.elses && this.elses.findAggregator) this.elses.findAggregator(query);
};

yy.CaseValue.prototype.toJS = function(context, tableid, defcols) {

	var s = '((function('+context+',params,alasql){var r;';
	if(this.expression) {
//			this.expression.toJS(context, tableid)
		s += 'v='+this.expression.toJS(context, tableid, defcols)+';';
		s += (this.whens||[]).map(function(w) { return ' if(v=='+w.when.toJS(context,tableid, defcols)
			+') {r='+w.then.toJS(context,tableid, defcols)+'}'; }).join(' else ');
		if(this.elses) s += ' else {r='+this.elses.toJS(context,tableid, defcols)+'}';
	} else {
		s += (this.whens||[]).map(function(w) { return ' if('+w.when.toJS(context,tableid, defcols)
			+') {r='+w.then.toJS(context,tableid, defcols)+'}'; }).join(' else ');
		if(this.elses) s += ' else {r='+this.elses.toJS(context,tableid,defcols)+'}';
	}
	// TODO remove bind from CASE
	s += ';return r;}).bind(this))('+context+',params,alasql)';

	return s;
};
/*
//
// JSON for Alasql.js
// Date: 19.11.2014
// (c) 2014, Andrey Gershun
//
*/

yy.Json = function (params) { return yy.extend(this, params); }
yy.Json.prototype.toString = function() {
	var s = ''; // '@'
	s += JSONtoString(this.value);
	s += '';
	return s;
};

var JSONtoString = alasql.utils.JSONtoString = function (obj) {
	var s = '';
	if(typeof obj == "string") s = '"'+obj+'"';
	else if(typeof obj == "number") s = obj;
	else if(typeof obj == "boolean") s = obj;
	else if(typeof obj == "object") {
		if(obj instanceof Array) {
			s += '['+obj.map(function(b){
				return JSONtoString(b);
			}).join(',')+']';
		} else if(!obj.toJS || obj instanceof yy.Json) {
			// to prevent recursion
			s = '{';
			var ss = [];
			for(var k in obj) {
				var s1 = ''; 
				if(typeof k == "string") s1 += '"'+k+'"';
				else if(typeof k == "number") s1 += k;
				else if(typeof k == "boolean") s1 += k;
				else {
					throw new Error('THis is not ES6... no expressions on left side yet');
				}
				s1 += ':'+JSONtoString(obj[k]);
				ss.push(s1);
			};
			s += ss.join(',')+'}';
		} else if(obj.toString)	{
			s = obj.toString();
		} else {
			throw new Error('1Can not show JSON object '+JSON.stringify(obj));
		}
	} else {
		throw new Error('2Can not show JSON object '+JSON.stringify(obj));		
	}

	return s;
}



function JSONtoJS(obj, context, tableid, defcols) {
	var s = '';
	if(typeof obj == "string") s = '"'+obj+'"';
	else if(typeof obj == "number") s = '('+obj+')';
	else if(typeof obj == "boolean") s = obj;
	else if(typeof obj == "object") {
		if(obj instanceof Array) {
			s += '['+obj.map(function(b){
				return JSONtoJS(b, context, tableid, defcols);
			}).join(',')+']';
		} else if(!obj.toJS || obj instanceof yy.Json) {
			// to prevent recursion
			s = '{';
			var ss = [];
			for(var k in obj) {
				var s1 = ''; 
				if(typeof k == "string") s1 += '"'+k+'"';
				else if(typeof k == "number") s1 += k;
				else if(typeof k == "boolean") s1 += k;
				else {
					throw new Error('THis is not ES6... no expressions on left side yet');
				}
				s1 += ':'+JSONtoJS(obj[k], context, tableid, defcols);
				ss.push(s1);
			};
			s += ss.join(',')+'}';
		} else if(obj.toJS)	{
			s = obj.toJS(context, tableid, defcols);
		} else {
			throw new Error('1Can not parse JSON object '+JSON.stringify(obj));
		}
	} else {
		throw new Error('2Can not parse JSON object '+JSON.stringify(obj));		
	}

	return s;
}

yy.Json.prototype.toJS = function(context, tableid, defcols) {
	// TODO reod
	return JSONtoJS(this.value,context, tableid, defcols);
}



/*
//
// CAST and CONVERT functions
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

yy.Convert = function(params) { return yy.extend(this, params); };
yy.Convert.prototype.toString = function() {
	var s = 'CONVERT(';
	s += this.dbtypeid;
	if(typeof this.dbsize != 'undefined') {
		s += '('+this.dbsize;
		if(this.dbprecision) s += ','+dbprecision;
		s += ')';
	}
	s += ','+this.expression.toString();
	if(this.style) s += ','+this.style;
	s += ')';
	return s;
};
yy.Convert.prototype.toJS = function(context, tableid, defcols) {

//	if(this.style) {
	return 'alasql.stdfn.CONVERT('+this.expression.toJS(context, tableid, defcols)
		+',{dbtypeid:"'+this.dbtypeid+'",dbsize:'+this.dbsize+',style:'+
		this.style+'})';		
//	}
/*
	if(this.dbtypeid == 'INT') {
		return '(('+this.expression.toJS(context, tableid, defcols)+')|0)';
	} if(this.dbtypeid == 'STRING') {
		return '(""+'+this.expression.toJS(context, tableid, defcols)+')';
	} if(this.dbtypeid == 'NUMBER') {
		return '(+('+this.expression.toJS(context, tableid, defcols)+'))';
	} if(this.dbtypeid == 'DATE') {
		if(alasql.options.datetimeformat == 'javascript') {
			return '(new Date('+this.expression.toJS(context, tableid, defcols)+'))';
		} else if(alasql.options.datetimeformat == 'sql') {
			return this.expression.toJS(context, tableid, defcols);
		}
	} if(this.dbtypeid == 'DATETIME') {
		if(alasql.options.datetimeformat == 'javascript') {
			return '(new Date('+this.expression.toJS(context, tableid, defcols)+'))';
		} else if(alasql.options.datetimeformat == 'sql') {
			return this.expression.toJS(context, tableid, defcols);
		}
	} else {

	};
*/
	throw new Error('There is not such type conversion for '+this.toString());
};

/**
 Convert one type to another
 */
alasql.stdfn.CONVERT = function(value, args) {
	var val = value;
//	console.log(args);
	if(args.style) {
		// TODO 9,109, 20,120,21,121,126,130,131 conversions
		var t;
		if(/\d{8}/.test(val)) t = new Date(+val.substr(0,4),+val.substr(4,2)-1,+val.substr(6,2));		
		else t = new Date(val);
		
		if(args.style == 1) { 			// mm/dd/yy
			val =  ("0"+(t.getMonth()+1)).substr(-2)+'/'+("0"+t.getDate()).substr(-2)+'/'+("0"+t.getYear()).substr(-2);
		} else if(args.style == 2) { 	// yy.mm.dd
			val =  ("0"+t.getYear()).substr(-2)+'.'+("0"+(t.getMonth()+1)).substr(-2)+'.'+("0"+t.getDate()).substr(-2);
		} else if(args.style == 3) { 	// dd/mm/yy
			val =  ("0"+t.getDate()).substr(-2)+'/'+("0"+(t.getMonth()+1)).substr(-2)+'/'+("0"+t.getYear()).substr(-2);
		} else if(args.style == 4) { 	// dd.mm.yy
			val =  ("0"+t.getDate()).substr(-2)+'.'+("0"+(t.getMonth()+1)).substr(-2)+'.'+("0"+t.getYear()).substr(-2);
		} else if(args.style == 5) { 	// dd-mm-yy
			val =  ("0"+t.getDate()).substr(-2)+'-'+("0"+(t.getMonth()+1)).substr(-2)+'-'+("0"+t.getYear()).substr(-2);
		} else if(args.style == 6) { 	// dd mon yy
			val =  ("0"+t.getDate()).substr(-2)+' '+t.toString().substr(4,3).toLowerCase()+' '+("0"+t.getYear()).substr(-2);
		} else if(args.style == 7) { 	// Mon dd,yy
			val =  t.toString().substr(4,3)+' '+("0"+t.getDate()).substr(-2)+','+("0"+t.getYear()).substr(-2);
		} else if(args.style == 8) { 	// hh:mm:ss
			val =  ("0"+t.getHours()).substr(-2)+':'+("0"+(t.getMinutes()+1)).substr(-2)+':'+("0"+t.getSeconds()).substr(-2);

		} else if(args.style == 10) { 	// mm-dd-yy
			val =  ("0"+(t.getMonth()+1)).substr(-2)+'-'+("0"+t.getDate()).substr(-2)+'-'+("0"+t.getYear()).substr(-2);
		} else if(args.style == 11) { 	// yy/mm/dd
			val =  ("0"+t.getYear()).substr(-2)+'/'+("0"+(t.getMonth()+1)).substr(-2)+'/'+("0"+t.getDate()).substr(-2);
		} else if(args.style == 12) { 	// yymmdd
			val =  ("0"+t.getYear()).substr(-2)+("0"+(t.getMonth()+1)).substr(-2)+("0"+t.getDate()).substr(-2);


		} else if(args.style == 101) { 			// mm/dd/yy
			val =  ("0"+(t.getMonth()+1)).substr(-2)+'/'+("0"+t.getDate()).substr(-2)+'/'+t.getFullYear();
		} else if(args.style == 102) { 	// yy.mm.dd
			val =  t.getFullYear()+'.'+("0"+(t.getMonth()+1)).substr(-2)+'.'+("0"+t.getDate()).substr(-2);
		} else if(args.style == 103) { 	// dd/mm/yy
			val =  ("0"+t.getDate()).substr(-2)+'/'+("0"+(t.getMonth()+1)).substr(-2)+'/'+t.getFullYear();
		} else if(args.style == 104) { 	// dd.mm.yy
			val =  ("0"+t.getDate()).substr(-2)+'.'+("0"+(t.getMonth()+1)).substr(-2)+'.'+t.getFullYear();
		} else if(args.style == 105) { 	// dd-mm-yy
			val =  ("0"+t.getDate()).substr(-2)+'-'+("0"+(t.getMonth()+1)).substr(-2)+'-'+t.getFullYear();
		} else if(args.style == 106) { 	// dd mon yy
			val =  ("0"+t.getDate()).substr(-2)+' '+t.toString().substr(4,3).toLowerCase()+' '+t.getFullYear();
		} else if(args.style == 107) { 	// Mon dd,yy
			val =  t.toString().substr(4,3)+' '+("0"+t.getDate()).substr(-2)+','+t.getFullYear();
		} else if(args.style == 108) { 	// hh:mm:ss
			val =  ("0"+t.getHours()).substr(-2)+':'+("0"+(t.getMinutes()+1)).substr(-2)+':'+("0"+t.getSeconds()).substr(-2);

		} else if(args.style == 110) { 	// mm-dd-yy
			val =  ("0"+(t.getMonth()+1)).substr(-2)+'-'+("0"+t.getDate()).substr(-2)+'-'+t.getFullYear();
		} else if(args.style == 111) { 	// yy/mm/dd
			val =  t.getFullYear()+'/'+("0"+(t.getMonth()+1)).substr(-2)+'/'+("0"+t.getDate()).substr(-2);
		} else if(args.style == 112) { 	// yymmdd
			val =  t.getFullYear()+("0"+(t.getMonth()+1)).substr(-2)+("0"+t.getDate()).substr(-2);
		} else {
			throw new Error('The CONVERT style '+args.style+' is not realized yet.');
		}
	};

	var udbtypeid = args.dbtypeid.toUpperCase();

	if(args.dbtypeid == 'Date') {
		return new Date(val);
	} else if(udbtypeid == 'DATE') {
		var d = new Date(val);
		var s = d.getFullYear()+"."+("0"+(d.getMonth()+1)).substr(-2)+"."+("0"+d.getDate()).substr(-2);
		return s;
	} else if(udbtypeid == 'DATETIME') {
		var d = new Date(val);
		var s = d.getFullYear()+"."+("0"+(d.getMonth()+1)).substr(-2)+"."+("0"+d.getDate()).substr(-2);
		s += " "+("0"+d.getHours()).substr(-2)+":"+("0"+d.getMinutes()).substr(-2)+":"+("0"+d.getSeconds()).substr(-2);
		s += '.'+("00"+d.getMilliseconds()).substr(-3)
		return s;
	} else if(['NUMBER','FLOAT'].indexOf(udbtypeid)>-1) {
		return +val;
	} else if(['MONEY'].indexOf(udbtypeid)>-1) {
		var m = +val;
		return (m|0)+((m*100)%100)/100;
	} else if(['BOOLEAN'].indexOf(udbtypeid)>-1) {
		return !!val;
	} else if(['INT','INTEGER','SMALLINT','BIGINT','SERIAL','SMALLSERIAL','BIGSERIAL'].indexOf(args.dbtypeid.toUpperCase())>-1) {
		return val|0;
	} else if(['STRING','VARCHAR','NVARCHAR', 'CHARACTER VARIABLE'].indexOf(args.dbtypeid.toUpperCase())>-1) {
		if(args.dbsize) return (""+val).substr(0,args.dbsize);
		else return ""+val;
	} else if(['CHAR','CHARACTER', 'NCHAR'].indexOf(udbtypeid)>-1) {
		return (val+(new Array(args.dbsize+1).join(" "))).substr(0,args.dbsize);
		//else return ""+val.substr(0,1);
	} else if(['DECIMAL','NUMERIC'].indexOf(udbtypeid)>-1) {
		var m = +val;
		var fxd = Math.pow(10,args.dbpecision);
		return (m|0)+((m*fxd)%fxd)/fxd;
	} else if(['JSON'].indexOf(udbtypeid)>-1) {
		if(typeof val == 'object') return val;
		try {
			return JSON.parse(val);
		} catch(err) { throw new Error('Cannot convert string to JSON');};
	};
	return val;
};


/*
//
// CREATE TABLE for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

yy.ColumnDef = function (params) { return yy.extend(this, params); }
yy.ColumnDef.prototype.toString = function() {
	var s =  this.columnid;
	if(this.dbtypeid){
		s += ' '+this.dbtypeid;
	}

	if(this.dbsize) {
		s += '('+this.dbsize;
		if(this.dbprecision){
			s += ','+this.dbprecision;
		}
		s += ')';
	}
	
	if(this.primarykey){
		s += ' PRIMARY KEY';
	}

	if(this.notnull){
		s += ' NOT NULL';
	}

	return s;
}

yy.CreateTable = function (params) { return yy.extend(this, params); }
yy.CreateTable.prototype.toString = function() {
	var s = 'CREATE';
	if(this.temporary){
		s+=' TEMPORARY';
	}

	if(this.view){
		s += ' VIEW';
	} else{
		s += ' '+(this.class?'CLASS':'TABLE');
	}

	if(this.ifnotexists){
		s += ' IF  NOT EXISTS';
	}
	s += ' '+this.table.toString();
	if(this.viewcolumns) {
		s += '('+this.viewcolumns.map(function(vcol){
			return vcol.toString();
		}).join(',')+')';
	}
	if(this.as){
		s += ' AS '+this.as;
	} else { 
		var ss = this.columns.map(function(col){
			return col.toString();
		});
		s += ' ('+ss.join(',')+')';
	}

	if(this.view && this.select) {
		s += ' AS '+this.select.toString();
	}

	return s;
}

// CREATE TABLE
//yy.CreateTable.prototype.compile = returnUndefined;
yy.CreateTable.prototype.execute = function (databaseid, params, cb) {
//	var self = this;
	var db = alasql.databases[this.table.databaseid || databaseid];

	var tableid = this.table.tableid;
	if(!tableid) {
		throw new Error('Table name is not defined');
	}

//	var ifnotexists = this.ifnotexists;
	var columns = this.columns;
	// if(false) {
	// 	if(!columns) {
	// 		throw new Error('Columns are not defined');
	// 	}
	// }
	var constraints = this.constraints||[];
//	console.log(this);

	// IF NOT EXISTS
	if(this.ifnotexists && db.tables[tableid]){
		return 0;
	}

	if(db.tables[tableid]) {
		throw new Error('Can not create table \''+tableid
			+'\', because it already exists in the database \''+db.databaseid+'\'');
	}

	var table = db.tables[tableid] = new alasql.Table(); // TODO Can use special object?

	// If this is a class
	if(this.class) {
		table.isclass = true;
	}
	table.identities = {};
	table.checkfn = [];

	var ss = [];
	if(columns) {
		columns.forEach(function(col) {
			var dbtypeid = col.dbtypeid;
			if(!alasql.fn[dbtypeid]){
				dbtypeid = dbtypeid.toUpperCase();
			}

			// Process SERIAL data type like Postgress
			if(['SERIAL','SMALLSERIAL','BIGSERIAL'].indexOf(dbtypeid)>-1){
				col.identity = {value:1,step:1};
			}
			
			var newcol = {
				columnid: col.columnid,
				dbtypeid: dbtypeid, 
				dbsize: col.dbsize, 			// Fixed issue #150
				dbprecision: col.dbprecision, 	// Fixed issue #150
				notnull: col.notnull,
				identity: col.identity
			};
			if(col.identity) {
				table.identities[col.columnid]={value:+col.identity.value,step:+col.identity.step};
//				ss.push('\''+col.columnid+'\':(alasql.databases[\''+db.databaseid+'\'].tables[\''
//					+tableid+'\'].identities[\''+col.columnid+'\'].value)');
			}
			if(col.check) {
				table.checkfn.push(new Function("r",'var y;return '+col.check.expression.toJS('r','')));
			}

			if(col.default) {
				ss.push('\''+col.columnid+'\':'+col.default.toJS('r',''));
			}


			// Check for primary key
			if(col.primarykey) {
				var pk = table.pk = {};
				pk.columns = [col.columnid];
				pk.onrightfns = 'r[\''+col.columnid+'\']';
				pk.onrightfn = new Function("r",'var y;return '+pk.onrightfns);
				pk.hh = hash(pk.onrightfns);
				table.uniqs[pk.hh] = {};
			}

			// UNIQUE clause
			if(col.unique) {
				var uk = {};
				table.uk = table.uk||[];
				table.uk.push(uk);
				uk.columns = [col.columnid];
				uk.onrightfns = 'r[\''+col.columnid+'\']';
				uk.onrightfn = new Function("r",'var y;return '+uk.onrightfns);
				uk.hh = hash(uk.onrightfns);
				table.uniqs[uk.hh] = {};
			}

			// UNIQUE clause
			if(col.foreignkey) {
//				console.log(138,col.foreignkey);
				var fk = col.foreignkey.table;
				var fktable = alasql.databases[fk.databaseid||alasql.useid].tables[fk.tableid];
				if(typeof fk.columnid === 'undefined') {
					if(fktable.pk.columns && fktable.pk.columns.length >0 ){
						fk.columnid = fktable.pk.columns[0];
					} else {
						throw new Error('FOREIGN KEY allowed only to tables with PRIMARY KEYs');
					}
				}
//					console.log(fktable.pk);
				var fkfn = function(r) {
					var rr = {};
					if(typeof r[col.columnid] === 'undefined'){
						return true;
					}
					rr[fk.columnid] = r[col.columnid];
					var addr = fktable.pk.onrightfn(rr);
//						console.log(r, rr, addr);
//						console.log(fktable.uniqs[fktable.pk.hh][addr]);
					if(!fktable.uniqs[fktable.pk.hh][addr]) {
						throw new Error('Foreign key "'+r[col.columnid]+'" is not found in table '+fktable.tableid);
					}
					return true;
				};
				table.checkfn.push(fkfn);
/*				var uk = {};
				if(typeof table.uk == 'undefined') table.uk = [];
				table.uk.push(uk);
				uk.columns = [col.columnid];
				uk.onrightfns = 'r[\''+col.columnid+'\']';
				uk.onrightfn = new Function("r",'return '+uk.onrightfns);
				uk.hh = hash(uk.onrightfns);
				table.uniqs[uk.hh] = {};
*/			}

			table.columns.push(newcol);
			table.xcolumns[newcol.columnid] = newcol;

		});
	}
	table.defaultfns = ss.join(',');


//	if(constraints) {
	constraints.forEach(function(con) {
		//console.log(con, con.columns);
		if(con.type === 'PRIMARY KEY') {
			if(table.pk) {
				throw new Error('Primary key already exists');
			}
			var pk = table.pk = {};
			pk.columns = con.columns;
			pk.onrightfns = pk.columns.map(function(columnid){
				return 'r[\''+columnid+'\']'
			}).join("+'`'+");
			pk.onrightfn = new Function("r",'var y;return '+pk.onrightfns);
			pk.hh = hash(pk.onrightfns);
			table.uniqs[pk.hh] = {};					
		} else if(con.type === 'CHECK') {
//			console.log(con.expression.toJS('r',''));
			table.checkfn.push(new Function("r",'var y;return '+con.expression.toJS('r','')));
		} else if(con.type === 'UNIQUE') {
//			console.log(con);
			var uk = {};
			table.uk = table.uk||[];
			table.uk.push(uk);
			uk.columns = con.columns;
			uk.onrightfns = uk.columns.map(function(columnid){
				return 'r[\''+columnid+'\']'
			}).join("+'`'+");
			uk.onrightfn = new Function("r",'var y;return '+uk.onrightfns);
			uk.hh = hash(uk.onrightfns);
			table.uniqs[uk.hh] = {};					
		} else if(con.type === 'FOREIGN KEY') {
//			console.log(con);
			var col = table.xcolumns[con.columns[0]];
			var fk = con.fktable;
			if(con.fkcolumns && con.fkcolumns.length>0){
				fk.columnid = con.fkcolumns[0];
 			}
 			var fktable = alasql.databases[fk.databaseid||alasql.useid].tables[fk.tableid];
			if(typeof fk.columnid === 'undefined') {
				fk.columnid = fktable.pk.columns[0];
			}
//					console.log(fktable.pk);
			var fkfn = function(r) {
				var rr = {};
				if(typeof r[col.columnid] === 'undefined'){
					return true;
				}
				rr[fk.columnid] = r[col.columnid];
				var addr = fktable.pk.onrightfn(rr);
//						console.log(r, rr, addr);
//						console.log(fktable.uniqs[fktable.pk.hh][addr]);
				if(!fktable.uniqs[fktable.pk.hh][addr]) {
	//console.log(228,table,col,fk);
					throw new Error('Foreign key "'+r[col.columnid]+'" is not found in table '+fktable.tableid);
				}
				return true;
			};
			table.checkfn.push(fkfn);
		}
	});

	if(this.view && this.viewcolumns) {
		var self = this;
		this.viewcolumns.forEach(function(vcol,idx){
			self.select.columns[idx].as = vcol.columnid;
		});
	}

//	console.log(100,db.engineid);
	if(db.engineid) {
//		console.log(101,db.engineid);
		return alasql.engines[db.engineid].createTable(this.table.databaseid || databaseid, tableid, this.ifnotexists, cb);
//		console.log('createtable',res1);
//		return res1; 
	}

//	}
//			if(table.pk) {
	table.insert = function(r,orreplace) {
		var table = this;

		var toreplace = false; // For INSERT OR REPLACE

		// IDENTINY or AUTO_INCREMENT
		// if(table.identities && table.identities.length>0) {
		// 	table.identities.forEach(function(ident){
		// 		r[ident.columnid] = ident.value;
		// 	});
		// }
//console.log(262,r);
//console.log(263,table.identities)
		for(var columnid in table.identities){
			var ident = table.identities[columnid];
//			console.log(ident);
			r[columnid] = ident.value;
//			console.log(ident);
		}
//console.log(270,r);


		if(table.checkfn && table.checkfn.length>0) {
			table.checkfn.forEach(function(checkfn){
				if(!checkfn(r)) {
//					if(orreplace) toreplace=true; else
					throw new Error('Violation of CHECK constraint');			
				}
			});
		}

		table.columns.forEach(function(column){
			if(column.notnull && typeof r[column.columnid] === 'undefined') {
				throw new Error('Wrong NULL value in NOT NULL column '+column.columnid);
			}
		});
		if(table.pk) {
			var pk = table.pk;
			var addr = pk.onrightfn(r);

			if(typeof table.uniqs[pk.hh][addr] !== 'undefined') {
//console.log(pk,addr,pk.onrightfn({ono:1}));			
//console.log(r, pk.onrightfn(r), pk.onrightfns);
				if(orreplace) toreplace=table.uniqs[pk.hh][addr]; else
				throw new Error('Cannot insert record, because it already exists in primary key index');
			} 
//			table.uniqs[pk.hh][addr]=r;
		}

		if(table.uk && table.uk.length) {
			table.uk.forEach(function(uk){
				var ukaddr = uk.onrightfn(r);
				if(typeof table.uniqs[uk.hh][ukaddr] !== 'undefined') {
					if(orreplace) toreplace=table.uniqs[uk.hh][ukaddr]; else
					throw new Error('Cannot insert record, because it already exists in unique index');
				} 				
//				table.uniqs[uk.hh][ukaddr]=r;
			});
		}

		if(toreplace) {
			// Do UPDATE!!!
//			console.log();
			table.update(function(t){
				for(var f in r) t[f] = r[f];
			},table.data.indexOf(toreplace),params);
		} else {
			table.data.push(r);

		// Final change before insert


		// Update indices


			for(var columnid in table.identities){
				var ident = table.identities[columnid];
	//			console.log(ident);
				ident.value += ident.step;
	//			console.log(ident);
			}

			if(table.pk) {
				var pk = table.pk;
				var addr = pk.onrightfn(r);
				table.uniqs[pk.hh][addr]=r;
			}
			if(table.uk && table.uk.length) {
				table.uk.forEach(function(uk){
					var ukaddr = uk.onrightfn(r);
					table.uniqs[uk.hh][ukaddr]=r;
				});
			}
		}

	};

	table.delete = function(index) {
		var table = this;
		var r = table.data[index];
		if(this.pk) {
			var pk = this.pk;
			var addr = pk.onrightfn(r);
			if(typeof this.uniqs[pk.hh][addr] === 'undefined') {
				throw new Error('Something wrong with primary key index on table');
			} else {
				this.uniqs[pk.hh][addr]=undefined;
			}
		}
		if(table.uk && table.uk.length) {
			table.uk.forEach(function(uk){
				var ukaddr = uk.onrightfn(r);
				if(typeof table.uniqs[uk.hh][ukaddr] === 'undefined') {
					throw new Error('Something wrong with unique index on table');
				} 				
				table.uniqs[uk.hh][ukaddr]=undefined;
			});
		}
	};

	table.deleteall = function() {
		this.data.length = 0;
		if(this.pk) {
//						var r = this.data[i];
			this.uniqs[this.pk.hh] = {};
		}
		if(table.uk && table.uk.length) {
			table.uk.forEach(function(uk){
				table.uniqs[uk.hh]={};
			});
		}
	};

	table.update = function(assignfn, i, params) {
		// TODO: Analyze the speed
		var r = cloneDeep(this.data[i]);
		var pk;
		// PART 1 - PRECHECK
		if(this.pk) {
			pk = this.pk;
			pk.pkaddr = pk.onrightfn(r,params);
			if(typeof this.uniqs[pk.hh][pk.pkaddr] === 'undefined') {
				throw new Error('Something wrong with index on table');
			} 
		}
		if(table.uk && table.uk.length) {
			table.uk.forEach(function(uk){
				uk.ukaddr = uk.onrightfn(r);
				if(typeof table.uniqs[uk.hh][uk.ukaddr] === 'undefined') {
					throw new Error('Something wrong with unique index on table');
				} 				
			});
		}
		
		assignfn(r,params,alasql);

		// PART 2 - POST CHECK
		if(table.checkfn && table.checkfn.length>0) {
			table.checkfn.forEach(function(checkfn){
				if(!checkfn(r)) {
					throw new Error('Violation of CHECK constraint');			
				}
			});
		}

		table.columns.forEach(function(column){
			if(column.notnull && typeof r[column.columnid] === 'undefined') {
				throw new Error('Wrong NULL value in NOT NULL column '+column.columnid);
			}
		});
		if(this.pk) {
				pk.newpkaddr = pk.onrightfn(r);
				if(typeof this.uniqs[pk.hh][pk.newpkaddr] !== 'undefined'
					&& pk.newpkaddr !== pk.pkaddr) {
					throw new Error('Record already exists');
				} 
		}

		if(table.uk && table.uk.length) {
			table.uk.forEach(function(uk){
				uk.newukaddr = uk.onrightfn(r);
				if(typeof table.uniqs[uk.hh][uk.newukaddr] !== 'undefined'
					&& uk.newukaddr !== uk.ukaddr) {
					throw new Error('Record already exists');
				} 				
			});
		}

		// PART 3 UPDATE
		if(this.pk) {
			this.uniqs[pk.hh][pk.pkaddr]=undefined;
			this.uniqs[pk.hh][pk.newpkaddr] = r;			
		}
		if(table.uk && table.uk.length) {
			table.uk.forEach(function(uk){
				table.uniqs[uk.hh][uk.ukaddr]=undefined;
				table.uniqs[uk.hh][uk.newukaddr]=r;
			});
		}


		this.data[i] = r;
	};

	if(this.view && this.select) {
		table.view = true;
//		console.log(this.select.toString());
//		console.log('this.table.databaseid',this.table.databaseid);
//		console.log(this.select.compile(this.table.databaseid||databaseid));
		table.select = this.select.compile(this.table.databaseid||databaseid);
	}
//	console.log(databaseid);
//	console.log(db.databaseid,db.tables);
//	console.log(table);
	var res;

	if(!alasql.options.nocount){
		res = 1;
	}
	
	if(cb){
		res = cb(res);
	}

	return res;
};



//
// Date functions
// 
// (c) 2014, Andrey Gershun
//

/** Standard JavaScript data types */

alasql.fn.Date = Object;
alasql.fn.Date = Date;
alasql.fn.Number = Number;
alasql.fn.String = String;
alasql.fn.Boolean = Boolean;

/** Extend Object with properties */
stdfn.EXTEND = alasql.utils.extend;


stdfn.CHAR = String.fromCharCode.bind(String);
stdfn.ASCII = function(a) {
    return a.charCodeAt(0);
};

/** 
 Return first non-null argument
 See https://msdn.microsoft.com/en-us/library/ms190349.aspx
*/
stdfn.COALESCE = function() {
	for(var i=0;i<arguments.length;i++) {
		if(typeof arguments[i] == 'undefined') continue;
		if(typeof arguments[i] == "number" && isNaN(arguments[i]) ) continue;
		return arguments[i];
	}
	return undefined;
}


stdfn.USER = function(){
	return 'alasql';
}

stdfn.OBJECT_ID = function(objid){
	return !!alasql.tables[objid];
};

stdfn.DATE = function (d) {
	if(/\d{8}/.test(d)) return new Date(+d.substr(0,4),+d.substr(4,2)-1,+d.substr(6,2));
	return new Date(d);
};

stdfn.NOW = function(){
	var d = new Date();
	var s = d.getFullYear()+"."+("0"+(d.getMonth()+1)).substr(-2)+"."+("0"+d.getDate()).substr(-2);
	s += " "+("0"+d.getHours()).substr(-2)+":"+("0"+d.getMinutes()).substr(-2)+":"+("0"+d.getSeconds()).substr(-2);
	s += '.'+("00"+d.getMilliseconds()).substr(-3)
	return s;
};

stdfn.GETDATE = stdfn.NOW;
stdfn.CURRENT_TIMESTAMP = stdfn.NOW;


// stdfn.GETDATE = function(){
// 	var d = new Date();
// 	var s = d.getFullYear()+"."+("0"+(d.getMonth()+1)).substr(-2)+"."+("0"+d.getDate()).substr(-2);
// 	return s;	
// }


stdfn.SECOND = function(d){
	var d = new Date(d);
	return d.getSeconds();
};


stdfn.MINUTE = function(d){
	var d = new Date(d);
	return d.getMinutes();
};

stdfn.HOUR = function(d){
	var d = new Date(d);
	return d.getHours();
};

stdfn.DAYOFWEEK = stdfn.WEEKDAY = function(d){
	var d = new Date(d);
	return d.getDay();
};

stdfn.DAY = stdfn.DAYOFMONTH = function(d){
	var d = new Date(d);
	return d.getDate();
};

stdfn.MONTH = function(d){
	var d = new Date(d);
	return d.getMonth()+1;
};

stdfn.YEAR = function(d){
	var d = new Date(d);
	return d.getFullYear();
};

stdfn.DATEDIFF = function(a,b){
	return (+new Date(a).valueOf()) - (new Date(b).valueOf());
};
/*
//
// DROP TABLE for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

yy.DropTable = function (params) { return yy.extend(this, params); };
yy.DropTable.prototype.toString = function() {
	var s = 'DROP'+' ';
	if(this.view) s += 'VIEW';
	else s += 'TABLE';
	if(this.ifexists) s += ' IF EXISTS';
	s += ' '+this.tables.toString();
	return s;
};


// DROP TABLE
/**
	Drop tables 
	@param {string} databaseid Database id
	@param {object} params Parameters
	@param {callback} cb Callback function
	@return Number of dropped tables
	@example
	DROP TABLE one;
	DROP TABLE IF NOT EXISTS two, three;
*/
yy.DropTable.prototype.execute = function (databaseid, params, cb) {
	var ifexists = this.ifexists;
	var res = 0; // No tables removed

	// For each table in the list
	this.tables.forEach(function(table){
		var db = alasql.databases[table.databaseid || databaseid];
		var tableid = table.tableid;

		/** @todo Test with AUTOCOMMIT flag is ON */
		/** @todo Test with IndexedDB and multiple tables */
		
		if(db.engineid /*&& alasql.options.autocommit*/) {

			/** @todo Check with IndexedDB */
			res += alasql.engines[db.engineid].dropTable(table.databaseid || databaseid,tableid, ifexists/*, cb*/);
		} else if(!ifexists || ifexists && db.tables[tableid]) {
			if(!db.tables[tableid]) {
				if(!alasql.options.dropifnotexists) {
					throw new Error('Can not drop table \''+table.tableid+'\', because it does not exist in the database.');
				}
			} else {
				delete db.tables[tableid];
				res++;
			}
		}

	});
	if(cb) res = cb(res);
	return res;
};


yy.TruncateTable = function (params) { return yy.extend(this, params); };
yy.TruncateTable.prototype.toString = function() {
	var s = 'TRUNCATE TABLE';
	s += ' '+this.table.toString();
	return s;
};

yy.TruncateTable.prototype.execute = function (databaseid, params, cb) {
	var db = alasql.databases[this.table.databaseid || databaseid];
	var tableid = this.table.tableid;
//	console.log(db, this.table.databaseid );
	if(db.engineid) {
		return alasql.engines[db.engineid].truncateTable(this.table.databaseid || databaseid,tableid, this.ifexists, cb);
	}
	if(db.tables[tableid]) {
		db.tables[tableid].data = [];
	} else {
		throw new Error('Cannot truncate table becaues it does not exist');
	}
	return 0;
};

/*
//
// CREATE VERTEX for AlaSQL
// Date: 21.04.2015
// (c) 2015, Andrey Gershun
//
*/

yy.CreateVertex = function (params) { return yy.extend(this, params); }
yy.CreateVertex.prototype.toString = function() {
	var s = 'CREATE VERTEX ';
	if(this.class){
		s += this.class+' ';
	}
	if(this.sharp){
		s += '#'+this.sharp+' ';
	}
	if(this.sets) {
		s += this.sets.toString();
	} else if(this.content) {
		s += this.content.toString();
	} else if(this.select) {
		s += this.select.toString();
	}

	return s;
}

yy.CreateVertex.prototype.toJS = function(context) {
//		console.log('yy.CreateVertex.toJS');
	var s = 'this.queriesfn['+(this.queriesidx-1)+'](this.params,null,'+context+')';
	// var s = '';
	return s;
};

// CREATE TABLE
/*
yy.CreateVertex.prototype.execute = function (databaseid,params,cb) {
	var res = 0;
	if(this.sets) {
		// var obj = {};
		// if(this.sets.length > 0) {
		// 	this.sets.forEach(function(st){
		// 		console.log(st);
		// 	});
		// }

	} else if(this.content) {

	} else if(this.select) {

	} else {
		// CREATE VERTEX without parameters
		var db = alasql.databases[databaseid];
		var vertex = {$id: db.counter++, $node:'vertex'};
		db.objects[vertex.$id] = vertex;
		res = vertex;
	}

	if(cb) res = cb(res);
	return res;
};
*/
yy.CreateVertex.prototype.compile = function (databaseid) {
	var dbid = databaseid;

	// CREATE VERTEX #id
	var sharp = this.sharp; 

	// CREATE VERTEX "Name"
	if(typeof this.name !== 'undefined') {
		var s = 'x.name='+this.name.toJS();
		var namefn = new Function('x',s);
	}

	if(this.sets && this.sets.length > 0) {
		var s = this.sets.map(function(st){
			return 'x[\''+st.column.columnid+'\']='+st.expression.toJS('x','');
		}).join(';');
		var setfn = new Function('x,params,alasql',s);
	} 

	/*
	Todo: check for content, select and default
	else if(this.content) {

	} else if(this.select) {

	} else {
	}
	*/


	var statement = function(params,cb){
		var res;

		// CREATE VERTEX without parameters
		var db = alasql.databases[dbid];
		var id;
		if(typeof sharp !== 'undefined') {
			id = sharp;
		} else {
			id = db.counter++;
		}
		var vertex = {$id: id, $node:'VERTEX'};
		db.objects[vertex.$id] = vertex;
		res = vertex;
		if(namefn){
			namefn(vertex);
		}
		if(setfn){
			setfn(vertex,params,alasql);
		}

		if(cb){
			res = cb(res);
		}
		return res;
	}
	return statement;
};

/*
	console.log('yy.CreateVertex.compile');

	if(this.sets) {
		var s = 'var a={};';
		if(this.sets.length > 0) {
			this.sets.forEach(function(st){
				console.log(st);
			});
		}

	} else if(this.content) {

	} else if(this.select) {

	}

};

*/

yy.CreateEdge = function (params) { return yy.extend(this, params); }
yy.CreateEdge.prototype.toString = function() {
//	console.log('here!');
	var s = 'CREATE EDGE'+' ';
	if(this.class){
		s += this.class+' ';
	}
	// todo: SET
	// todo: CONTENT
	// todo: SELECT
	return s;
}

yy.CreateEdge.prototype.toJS = function(context) {
	var s = 'this.queriesfn['+(this.queriesidx-1)+'](this.params,null,'+context+')';
	return s;
};

// CREATE TABLE
/*
yy.CreateEdge.prototype.execute = function (databaseid,params,cb) {
	var res = 1;
	if(cb) res = cb(res);
	return res;
};
*/
yy.CreateEdge.prototype.compile = function (databaseid) {
	var dbid = databaseid;
	var fromfn = new Function('params,alasql','var y;return '+this.from.toJS());
	var tofn = new Function('params,alasql','var y;return '+this.to.toJS());

	// CREATE VERTEX "Name"
	if(typeof this.name !== 'undefined') {
		var s = 'x.name='+this.name.toJS();
		var namefn = new Function('x',s);
	}

	if(this.sets && this.sets.length > 0) {
		var s = this.sets.map(function(st){
			return 'x[\''+st.column.columnid+'\']='+st.expression.toJS('x','');
		}).join(';');
		var setfn = new Function('x,params,alasql','var y;'+s);
	} 

	/*
	todo: handle content, select and default
	else if(this.content) {

	} else if(this.select) {

	} else {
	}
	*/

	var statement = function(params,cb){
		var res = 0;
			// CREATE VERTEX without parameters
		var db = alasql.databases[dbid];
		var edge = {$id: db.counter++, $node:'EDGE'};
		var v1 = fromfn(params,alasql);
		var v2 = tofn(params,alasql);
		// Set link
		edge.$in = [v1.$id];
		edge.$out = [v2.$id];
		// Set sides
		if(v1.$out === undefined){
			v1.$out = [];
		}
		v1.$out.push(edge.$id);
		
		if(typeof v2.$in === undefined){
			v2.$in = [];
		}
		v2.$in.push(edge.$id);
		
		// Save in objects
		db.objects[edge.$id] = edge;
		res = edge;
		if(namefn){
			namefn(edge);
		}

		if(setfn){
			setfn(edge,params,alasql);
		}

		if(cb){
			res = cb(res);
		}

		return res;
	};
	return statement;

};



yy.CreateGraph = function (params) { return yy.extend(this, params); }
yy.CreateGraph.prototype.toString = function() {
	var s = 'CREATE GRAPH'+' ';
	if(this.class){
		s += this.class+' ';
	}
	return s;
}

// yy.CreateEdge.prototype.toJS = function(context, tableid, defcols) {
// 	var s = 'this.queriesfn['+(this.queriesidx-1)+'](this.params,null,'+context+')';
// 	return s;
// };

yy.CreateGraph.prototype.execute = function (databaseid,params,cb) {
	var res = [];
	if(this.from) {
		if(alasql.from[this.from.funcid]) {
			this.graph = alasql.from[this.from.funcid.toUpperCase()]
		}
	}

//	stop;
		this.graph.forEach(function(g){
			if(g.source) {
				// GREATE EDGE
				var e = {};
				if(typeof g.as !== 'undefined'){
					alasql.vars[g.as] = e;
				}

				if(typeof g.prop !== 'undefined') {
	//				e[g.prop] = e;
	//				v.$id = g.prop; // We do not create $id for edge automatically
					e.name = g.prop;				
				}
				if(typeof g.sharp !== 'undefined'){
					e.$id = g.sharp;
				}
				if(typeof g.name !== 'undefined'){
					e.name = g.name;
				}
				if(typeof g.class !== 'undefined'){
					e.$class = g.class;
				}

				var db = alasql.databases[databaseid];
				if(typeof e.$id === 'undefined') {
					e.$id = db.counter++;
				}
				e.$node='EDGE';
				if(typeof g.json !== 'undefined') {
					extend(e,(new Function('params,alasql','var y;return '+
					g.json.toJS()))(params,alasql));
				}

				var v1;
				if(g.source.vars) {
					var vo = alasql.vars[g.source.vars];
					if(typeof vo === 'object'){
						v1 = vo;
					} else{
						v1 = db.objects[vo];
					}
				} else {
					var av1 = g.source.sharp; 
					if(typeof av1 === 'undefined'){
						av1 = g.source.prop;
					} 
					v1 = alasql.databases[databaseid].objects[av1];
					if( 
						typeof v1 === 'undefined' && 
						alasql.options.autovertex && 
						((typeof g.source.prop !== 'undefined') || (typeof g.source.name !== 'undefined'))
					){
						v1 = findVertex(g.source.prop || g.source.name);
						if(typeof v1 === 'undefined') {
							v1 = createVertex(g.source);
						}
					}

				}

				var v2;
				if(g.source.vars) {
					var vo = alasql.vars[g.target.vars];
					if(typeof vo === 'object'){
						v2 = vo;
					} else{
						v2 = db.objects[vo];
					}
				} else {
					var av2 = g.target.sharp; 
					if(typeof av2 === 'undefined'){
						av2 = g.target.prop; 
					}
					v2 = alasql.databases[databaseid].objects[av2];
					if(
						typeof v2 === 'undefined' && 
						alasql.options.autovertex && 
						((typeof g.target.prop !== 'undefined') || (typeof g.target.name !== 'undefined'))
					) {
						v2 = findVertex(g.target.prop || g.target.name);
						if(typeof v2 === 'undefined') {
							v2 = createVertex(g.target);
						}
					}
				}

//console.log(v1,v2);
				// Set link
				e.$in = [v1.$id];
				e.$out = [v2.$id];
				// Set sides
				if(typeof v1.$out === 'undefined'){
					v1.$out = [];
				}
				v1.$out.push(e.$id);
				if(typeof v2.$in === 'undefined'){
					v2.$in = [];
				}
				v2.$in.push(e.$id);

				db.objects[e.$id] = e;
				if(typeof e.$class !== 'undefined') {
					if(typeof alasql.databases[databaseid].tables[e.$class] === 'undefined') {
						throw new Error('No such class. Pleace use CREATE CLASS');
					} else {
						// TODO - add insert()
						alasql.databases[databaseid].tables[e.$class].data.push(e);
					}
				}

				res.push(e.$id);

			} else {
				createVertex(g);
			}
		});

	if(cb){
		res = cb(res);
	}
	return res;

	// Find vertex by name
	function findVertex(name) {
		var objects = alasql.databases[alasql.useid].objects;
		for(var k in objects) {
			if(objects[k].name === name) {
				return objects[k];
			}
		}
		return undefined;
	}

	function createVertex(g) {
		// GREATE VERTEX
		var v = {};
		if(typeof g.as !== 'undefined'){
			alasql.vars[g.as] = v;
		}

		if(typeof g.prop !== 'undefined') {
	//				v[g.prop] = true;
			v.$id = g.prop;
			v.name = g.prop;				
		}

		if(typeof g.sharp !== 'undefined'){
			v.$id = g.sharp;
		}
		if(typeof g.name !== 'undefined'){
			v.name = g.name;
		}
		if(typeof g.class !== 'undefined'){
			v.$class = g.class;
		}

		var db = alasql.databases[databaseid];
		if(typeof v.$id === 'undefined') {
			v.$id = db.counter++;
		}
		v.$node='VERTEX';
		if(typeof g.json !== 'undefined') {
			extend(v,(new Function('params,alasql','var y;return '+
			g.json.toJS()))(params,alasql));
		}
		db.objects[v.$id] = v;
		if(typeof v.$class !== 'undefined') {
			if(typeof alasql.databases[databaseid].tables[v.$class] === 'undefined') {
				throw new Error('No such class. Pleace use CREATE CLASS');
			} else {
				// TODO - add insert()
				alasql.databases[databaseid].tables[v.$class].data.push(v);
			}
		}

		res.push(v.$id);
		return v;
	}


};



yy.CreateGraph.prototype.compile1 = function (databaseid) {
	var dbid = databaseid;
	var fromfn = new Function('params,alasql','var y;return '+this.from.toJS());
	var tofn = new Function('params,alasql','var y;return '+this.to.toJS());

	// CREATE VERTEX "Name"
	if(typeof this.name !== 'undefined') {
		var s = 'x.name='+this.name.toJS();
		var namefn = new Function('x',s);
	}

	if(this.sets && this.sets.length > 0) {
		var s = this.sets.map(function(st){
			return 'x[\''+st.column.columnid+'\']='+st.expression.toJS('x','');
		}).join(';');
		var setfn = new Function('x,params,alasql','var y;'+s);
	} 

	/*
	Todo: handle content, select and default
	else if(this.content) {

	} else if(this.select) {

	} else {
	
	}
	*/

	var statement = function(params,cb){
		var res = 0;
			// CREATE VERTEX without parameters
		var db = alasql.databases[dbid];
		var edge = {$id: db.counter++, $node:'EDGE'};
		var v1 = fromfn(params,alasql);
		var v2 = tofn(params,alasql);
		// Set link
		edge.$in = [v1.$id];
		edge.$out = [v2.$id];
		// Set sides
		if(typeof v1.$out === 'undefined'){
			v1.$out = [];
		}
		v1.$out.push(edge.$id);

		if(typeof v2.$in === 'undefined'){
			v2.$in = [];
		}
		v2.$in.push(edge.$id);
		// Save in objects
		db.objects[edge.$id] = edge;
		res = edge;
		if(namefn){
			namefn(edge);
		}
		if(setfn){
			setfn(edge,params,alasql);
		}

		if(cb){
			res = cb(res);
		}
		return res;
	}
	return statement;

};

/*
//
// ALTER TABLE for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

// ALTER TABLE table1 RENAME TO table2
yy.AlterTable = function (params) { return yy.extend(this, params); }
yy.AlterTable.prototype.toString = function() {
	var s = 'ALTER TABLE '+this.table.toString(); 
	if(this.renameto) s += ' RENAME TO '+this.renameto;
	return s;
}

yy.AlterTable.prototype.execute = function (databaseid, params, cb) {
	var db = alasql.databases[databaseid];
	db.dbversion = Date.now();

	if(this.renameto) {
		var oldtableid = this.table.tableid;
		var newtableid = this.renameto;
			var res = 1;
			if(db.tables[newtableid]) {
				throw new Error("Can not rename a table '"+oldtableid+"' to '"
					+newtableid+"', because the table with this name already exists");
			} else if(newtableid == oldtableid) {
				throw new Error("Can not rename a table '"+oldtableid+"' to itself");
			} else {
				db.tables[newtableid] = db.tables[oldtableid];
				delete db.tables[oldtableid];
				res = 1;
			};
			if(cb) cb(res)
			return res;
	} else if(this.addcolumn) {
		var db = alasql.databases[this.table.databaseid || databaseid];
		db.dbversion++;
		var tableid = this.table.tableid;
		var table = db.tables[tableid];
		var columnid = this.addcolumn.columnid;
		if(table.xcolumns[columnid]) {
			throw new Error('Cannot add column "'+columnid+'", because it already exists in the table "'+tableid+'"');
		}

		var col = {
			columnid:columnid,
			dbtypeid:this.dbtypeid,
			dbsize:this.dbsize,
			dbprecision:this.dbprecision,
			dbenum:this.dbenum,
			defaultfns: null // TODO defaultfns!!!
		};

		var defaultfn = function(){};

		table.columns.push(col);
		table.xcolumns[columnid] = col;

		for(var i=0, ilen=table.data.length; i<ilen; i++) {
//				console.log(table.data[i][columnid]);
			table.data[i][columnid] = defaultfn();
		}

		// TODO
		return 1;
	} else if(this.modifycolumn) {
		var db = alasql.databases[this.table.databaseid || databaseid];
		db.dbversion++;
		var tableid = this.table.tableid;
		var table = db.tables[tableid];
		var columnid = this.modifycolumn.columnid;

		if(!table.xcolumns[columnid]) {
			throw new Error('Cannot modify column "'+columnid+'", because it was not found in the table "'+tableid+'"');
		}

		var col = table.xcolumns[columnid];
		col.dbtypeid = this.dbtypeid;
		col.dbsize = this.dbsize;
		col.dbprecision = this.dbprecision;
		col.dbenum = this.dbenum;


		// TODO
		return 1;
	} else if(this.renamecolumn) {
		var db = alasql.databases[this.table.databaseid || databaseid];
		db.dbversion++;

		var tableid = this.table.tableid;
		var table = db.tables[tableid];
		var columnid = this.renamecolumn;
		var tocolumnid = this.to;

		var col;
		if(!table.xcolumns[columnid]) {
			throw new Error('Column "'+columnid+'" is not found in the table "'+tableid+'"');
		}
		if(table.xcolumns[tocolumnid]) {
			throw new Error('Column "'+tocolumnid+'" already exists in the table "'+tableid+'"');
		}

		if(columnid != tocolumnid) {
			for(var j=0; j<table.columns.length; j++) {
				if(table.columns[j].columnid == columnid) {
					table.columns[j].columnid = tocolumnid;
				}
			};

			table.xcolumns[tocolumnid]=table.xcolumns[columnid];
			delete table.xcolumns[columnid];

			for(var i=0, ilen=table.data.length; i<ilen; i++) {
//				console.log(table.data[i][columnid]);
				table.data[i][tocolumnid] = table.data[i][columnid];
				delete table.data[i][columnid];
			}
			return table.data.length;
		}
		else return 0;
	} else if(this.dropcolumn) {
		var db = alasql.databases[this.table.databaseid || databaseid];
		db.dbversion++;
		var tableid = this.table.tableid;
		var table = db.tables[tableid];
		var columnid = this.dropcolumn;

		var found = false;
		for(var j=0; j<table.columns.length; j++) {
			if(table.columns[j].columnid == columnid) {
				found = true;
				table.columns.splice(j,1);
				break;
			}
		};

		if(!found) {
			throw new Error('Cannot drop column "'+columnid+'", because it was not found in the table "'+tableid+'"');
		}

		delete table.xcolumns[columnid];

		for(var i=0, ilen=table.data.length; i<ilen; i++) {
			delete table.data[i][columnid];
		}
		return table.data.length;
	} else {
		throw Error('Unknown ALTER TABLE method');
	}

};


/*
//
// CREATE TABLE for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

yy.CreateIndex = function (params) { return yy.extend(this, params); }
yy.CreateIndex.prototype.toString = function() {
	var s = 'CREATE';
	if(this.unique) s+=' UNIQUE';
	s += ' INDEX ' + this.indexid + " ON "+this.table.toString();
	s += "("+this.columns.toString()+")";
	return s;
}

// CREATE TABLE
yy.CreateIndex.prototype.execute = function (databaseid,params,cb) {
//	var self = this;
	var db = alasql.databases[databaseid];
	var tableid = this.table.tableid;
	var table = db.tables[tableid];
	var indexid = this.indexid;

	if(this.unique) {
		var rightfns = this.columns.map(function(colid){return "r[\'"+colid+"\']"}).join("+'`'+");
		table.uniqdefs[indexid] = {
			rightfns: rightfns
		};
		var ux = table.uniqs[indexid] = {};
		if(table.data.length > 0) {
			for(var i=0, ilen=table.data.length; i<ilen;i++) {
				var addr = rightfns(table.data[i]);
				if(!ux[addr]) {
					ux[addr] = {num:0};
				};
				ux[addr].num++;
			}
		}
	} else {
		var rightfns = this.columns.map(function(colid){return "r[\'"+colid+"\']"}).join("+'`'+");
		var hh = hash(rightfns);
		table.inddefs[indexid] = {rightfns:rightfns, hh:hh};
		table.indices[hh] = {};

		var ix = table.indices[hh] = {};
		if(table.data.length > 0) {
			for(var i=0, ilen=table.data.length; i<ilen;i++) {
				var addr = rightfns(table.data[i]);
				if(!ix[addr]) {
					ix[addr] = [];
				};
				ix[addr].push(table.data[i]);
			}
		}
	};
	var res = 1;
	if(cb) res = cb(res);
	return res;
};



/*
//
// DROP TABLE for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

yy.DropIndex = function (params) { return yy.extend(this, params); }
yy.DropIndex.prototype.toString = function() {
	return 'INDEX TABLE' + this.indexid;
}


// DROP TABLE
yy.DropIndex.prototype.compile = function (db) {
	var indexid = this.indexid;
	return function() {
		return 1;
	}
};

/*
//
// WITH SELECT for Alasql.js
// Date: 11.01.2015
// (c) 2015, Andrey Gershun
//
*/


yy.WithSelect = function (params) { return yy.extend(this, params); }
yy.WithSelect.prototype.toString = function() {
	var s = 'WITH ';
	s += this.withs.map(function(w){
		return w.name+' AS ('+w.select.toString()+')';
	}).join(',')+' ';
	s += this.select.toString();
	return s;
};

yy.WithSelect.prototype.execute = function (databaseid,params,cb) {
	var self = this;
	// Create temporary tables
	var savedTables = [];
	self.withs.forEach(function(w){
		savedTables.push(alasql.databases[databaseid].tables[w.name]);
		var tb = alasql.databases[databaseid].tables[w.name] = new Table({tableid:w.name});
		tb.data = w.select.execute(databaseid,params);
	});

	var res = 1;
	res = this.select.execute(databaseid,params,function(data){
		// Clear temporary tables
//		setTimeout(function(){
			self.withs.forEach(function(w,idx){
				if(savedTables[idx]) alasql.databases[databaseid].tables[w.name] = savedTables[idx] ;
				else delete alasql.databases[databaseid].tables[w.name];
			});			
//		},0);

		if(cb) data = cb(data);
		return data;
	});
	return res;
};

/*
// CREATE TABLE
//yy.CreateTable.prototype.compile = returnUndefined;
yy.CreateView.prototype.execute = function (databaseid) {
//	var self = this;
	var db = alasql.databases[this.view.databaseid || databaseid];
	var v = db.views[this.view.viewid] = new View();

//	console.log(databaseid);
//	console.log(db.databaseid,db.tables);
//	console.log(table);

	return 1;
};

yy.DropView = function (params) { return yy.extend(this, params); }
yy.DropView.prototype.toString = function() {
	var s = 'DROP'+' '+'VIEW';
	s += ' '+this.view.toString();
	return s;
};

// CREATE TABLE
//yy.CreateTable.prototype.compile = returnUndefined;
yy.DropView.prototype.execute = function (databaseid) {
//	var self = this;
};

*/


/*
//
// IF for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

yy.If = function (params) { return yy.extend(this, params); }
yy.If.prototype.toString = function() {
	var s = 'IF'+' ';
	s += this.expression.toString();
	s += ' '+this.thenstat.toString();
	if(this.elsestat) s += ' ELSE '+this.thenstat.toString();
	return s;
};

// CREATE TABLE
//yy.CreateTable.prototype.compile = returnUndefined;
yy.If.prototype.execute = function (databaseid,params,cb){
	var res;
//	console.log(this);
//	console.log(this.expression.toJS('{}','',null));
//	console.log();
	var fn = new Function('params,alasql,p','var y;return '+this.expression.toJS('({})','',null)).bind(this);
//	var fn = new Function('params,alasql,p','console.log(this.thenstat);return '+this.expression.toJS('({})','',null)).bind(this);
	if(fn(params,alasql)) res = this.thenstat.execute(databaseid,params,cb);
	else {
		if(this.elsestat) res = this.elsestat.execute(databaseid,params,cb);
		else {
			if(cb) res = cb(res);
		}
	}
//	else res = this.elsestat.execute(databaseid,params,cb,scope);
	return res;
};



/*
//
// CREATE VIEW for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

yy.While = function (params) { return yy.extend(this, params); }
yy.While.prototype.toString = function() {
	var s = 'WHILE ';
	s += this.expression.toString();
	s += ' '+this.loopstat.toString();
	return s;
};

yy.While.prototype.execute = function (databaseid,params,cb) {
	var self = this;
	var res = [];
//	console.log(this.expression.toJS());
	var fn = new Function('params,alasql,p','var y;return '+this.expression.toJS());
//	console.log('cb',!!cb);
	if(cb) {
		var first = false;
		loop();
		function loop(data) {
			if(first) {
				res.push(data);
			} else {
				first = true;
			};
			setTimeout(function(){
				if(fn(params,alasql)) {
					self.loopstat.execute(databaseid,params,loop);
				} else {
					res = cb(res);
				}
			},0);
		}		
	} else {
		while(fn(params,alasql)) {
			var res1 = self.loopstat.execute(databaseid,params); 
			res.push(res1);
		}
	}
	return res;
};

yy.Break = function (params) { return yy.extend(this, params); }
yy.Break.prototype.toString = function() {
	var s = 'BREAK';
	return s;
};

yy.Break.prototype.execute = function (databaseid,params,cb,scope) {
	var res = 1;
	if(cb) res = cb(res);
	return res;
};

yy.Continue = function (params) { return yy.extend(this, params); }
yy.Continue.prototype.toString = function() {
	var s = 'CONTINUE';
	return s;
};

yy.Continue.prototype.execute = function (databaseid,params,cb,scope) {
	var res = 1;
	if(cb) res = cb(res);	
	return res;
};

yy.BeginEnd = function (params) { return yy.extend(this, params); }
yy.BeginEnd.prototype.toString = function() {
	var s = 'BEGIN '+this.statements.toString()+' END';
	return s;
};

yy.BeginEnd.prototype.execute = function (databaseid,params,cb,scope) {
	var self = this;
	var res = [];

	var idx = 0;
	runone();
	function runone() {
		self.statements[idx].execute(databaseid,params,function(data){
			res.push(data);
			idx++;
			if(idx<self.statements.length) return runone();
			if(cb) res = cb(res);
		});
	}
	return res;
};

/*
//
// INSERT for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

yy.Insert = function (params) { return yy.extend(this, params); }
yy.Insert.prototype.toString = function() {
	var s = 'INSERT ';
	if(this.orreplace) s += 'OR REPLACE ';
	s += 'INTO '+this.into.toString();
	if(this.columns) s += '('+this.columns.toString()+')';
	if(this.values) s += ' VALUES '+this.values.toString();
	if(this.select) s += ' '+this.select.toString();
	return s;
}

yy.Insert.prototype.toJS = function(context, tableid, defcols) {
//	console.log('Expression',this);
//	if(this.expression.reduced) return 'true';
//	return this.expression.toJS(context, tableid, defcols);
// console.log('Select.toJS', 81, this.queriesidx);
//	var s = 'this.queriesdata['+(this.queriesidx-1)+'][0]';

	var s = 'this.queriesfn['+(this.queriesidx-1)+'](this.params,null,'+context+')';
//	s = '(console.log(this.queriesfn[0]),'+s+')';
//	console.log(this,s);

	return s;
};

yy.Insert.prototype.compile = function (databaseid) {
	var self = this;
	databaseid = self.into.databaseid || databaseid
	var db = alasql.databases[databaseid];
//	console.log(self);
	var tableid = self.into.tableid;
	var table = db.tables[tableid];

	// Check, if this dirty flag is required
	var s = '';
	var sw = '';
	var s = 'db.tables[\''+tableid+'\'].dirty=true;';
	var s3 = 'var a,aa=[],x;';

	var s33;


// INSERT INTO table VALUES
	if(this.values) {

		if(this.exists) {
			this.existsfn  = this.exists.map(function(ex) {
				var nq = ex.compile(databaseid);
				nq.query.modifier='RECORDSET';
				return nq;
			});
		}
		if(this.queries) {
			this.queriesfn = this.queries.map(function(q) {
				var nq = q.compile(databaseid);
				nq.query.modifier='RECORDSET';
				return nq;
			});		
		}


//		console.log(1);
		self.values.forEach(function(values) {
			var ss = [];

//			s += 'db.tables[\''+tableid+'\'].data.push({';

//			s += '';
			if(self.columns) {
				self.columns.forEach(function(col, idx){
//console.log(db.tables, tableid, table);
		//			ss.push(col.columnid +':'+ self.values[idx].value.toString());
		//			console.log(rec[f.name.value]);
		//			if(rec[f.name.value] == "NULL") rec[f.name.value] = undefined;

		//			if(table.xflds[f.name.value].dbtypeid == "INT") rec[f.name.value] = +rec[f.name.value]|0;
		//			else if(table.xflds[f.name.value].dbtypeid == "FLOAT") rec[f.name.value] = +rec[f.name.value];
					var q = "'"+col.columnid +'\':';
					if(table.xcolumns && table.xcolumns[col.columnid]) { 
						if(["INT","FLOAT","NUMBER","MONEY"].indexOf(table.xcolumns[col.columnid].dbtypeid) >=0) {
							//q += ''
							q += "(x="+values[idx].toJS()+",x==undefined?undefined:+x)";
						} else if (alasql.fn[table.xcolumns[col.columnid].dbtypeid]) {
							q += "(new "+table.xcolumns[col.columnid].dbtypeid+"(";
							q += values[idx].toJS();
							q += "))";
						} else {
							q += values[idx].toJS();
						};
					} else { 
						q += values[idx].toJS();
					}
					ss.push(q);

				});
			} else {
//				var table = db.tables[tableid];
//	console.log('table1', db, self);
//console.log(111, table.columns);
//console.log(74,table);
				if((values instanceof Array) && table.columns && table.columns.length > 0) {
					table.columns.forEach(function(col, idx){

						var q = '\''+col.columnid +'\':';
//						var val = values[idx].toJS();

						if(["INT","FLOAT","NUMBER","MONEY"].indexOf(col.dbtypeid) >=0) {
							q += "+"+values[idx].toJS();
						} else if (alasql.fn[col.dbtypeid]) {
							q += "(new "+col.dbtypeid+"(";
							q += values[idx].toJS();
							q += "))";
						} else { 
							q += values[idx].toJS();
						}

						 // if(table.xcolumns && table.xcolumns[col.columnid] && 
						 //  (table.xcolumns[col.columnid].dbtypeid == "DATE" ||
							// table.xcolumns[col.columnid].dbtypeid == "DATETIME"
						 //  )) {
						 // 	val = "(new Date("+val+"))";
						 // }
						// 		|| table.xcolumns[col.columnid].dbtypeid == "FLOAT"
						// 		|| table.xcolumns[col.columnid].dbtypeid == "NUMBER"
						// 		|| table.xcolumns[col.columnid].dbtypeid == "MONEY"
						// 	)) q += '+';
					//	console.log(self.values[idx].toString());
			//console.log(self);
//						q += val;

						// if(table.xcolumns && table.xcolumns[col.columnid] && table.xcolumns[col.columnid].dbtypeid == "INT") q += '|0';
						ss.push(q);

			//			console.log(fld);
						// TODO: type checking and conversions
			//			rec[fld.fldid] = eval(self.insertExpression[idx].toJS('',''));
			//			console.log(rec[fld.fldid]);
			//			if(rec[fld.fldid] == "NULL") rec[fld.fldid] = undefined;

			//			if(table.xflds[fld.fldid].dbtypeid == "INT") rec[fld.fldid] = +rec[fld.fldid]|0;
			//			else if(table.xflds[fld.fldid].dbtypeid == "FLOAT" || table.xflds[fld.fldid].dbtypeid == "MONEY" ) 
			//				rec[fld.fldid] = +rec[fld.fldid];
					});
				} else {
//					console.log(222,values);
//					sw = 'var w='+JSONtoJS(values)+';for(var k in w){r[k]=w[k]};';
					sw = JSONtoJS(values);
				}
			}
//console.log(ss);

			if(db.tables[tableid].defaultfns) {
				ss.unshift(db.tables[tableid].defaultfns);
			};
			if(sw) {
				s += 'a='+sw+';';
			} else {
				s += 'a={'+ss.join(',')+'};';
			}

			// If this is a class
			if(db.tables[tableid].isclass) {
				s += 'var db=alasql.databases[\''+databaseid+'\'];';
				s+= 'a.$class="'+tableid+'";';
				s+= 'a.$id=db.counter++;';
				s+= 'db.objects[a.$id]=a;';
			};
//			s += 'db.tables[\''+tableid+'\'].insert(r);';
	        if(db.tables[tableid].insert) {
				s += 'var db=alasql.databases[\''+databaseid+'\'];';
				s += 'db.tables[\''+tableid+'\'].insert(a,'+(self.orreplace?"true":"false")+');';
	        } else {
				s += 'aa.push(a);';
			}
		});

		s33 = s3+s;

        if(db.tables[tableid].insert) {
//			s += 'alasql.databases[\''+databaseid+'\'].tables[\''+tableid+'\'].insert(r);';
        } else {
            s += 'alasql.databases[\''+databaseid+'\'].tables[\''+tableid+'\'].data='+	
            'alasql.databases[\''+databaseid+'\'].tables[\''+tableid+'\'].data.concat(aa);';
        }

        if(db.tables[tableid].insert) {
        	if(db.tables[tableid].isclass) {
	        	s += 'return a.$id;';
        	} else {
				s += 'return '+self.values.length;
        	}
        } else {
			s += 'return '+self.values.length;
        }

//console.log(186,s3+s);
		var insertfn = new Function('db, params, alasql','var y;'+s3+s).bind(this);
	
// INSERT INTO table SELECT

	} else if(this.select) {
		selectfn = this.select.compile(databaseid);
	    if(db.engineid && alasql.engines[db.engineid].intoTable) {
			var statement = function(params, cb) {
				var aa = selectfn(params);
				var res = alasql.engines[db.engineid].intoTable(db.databaseid,tableid,aa,null, cb);
				return res;
			};
			return statement;
	    } else {
			var insertfn = function(db, params, alasql) {
				var res = selectfn(params);
		        if(db.tables[tableid].insert) {
		        	// If insert() function exists (issue #92)
		        	for(var i=0,ilen=res.length;i<ilen;i++) {
		        		db.tables[tableid].insert(res[i],self.orreplace);
		        	}
		        } else {
					db.tables[tableid].data = db.tables[tableid].data.concat(res);
		        };
		        if(alasql.options.nocount) return;
				else return res.length;
			}
		}


	} else if(this.default) {
		var insertfns = 'db.tables[\''+tableid+'\'].data.push({'+table.defaultfns+'});return 1;';
        var insertfn = new Function('db,params,alasql',insertfns); 
    } else {
    	throw new Error('Wrong INSERT parameters');
    }

//    console.log(1,s);
//    	console.log(s33);

    if(db.engineid && alasql.engines[db.engineid].intoTable && alasql.options.autocommit) {
		var statement = function(params, cb) {
			var aa = new Function("db,params",'var y;'+s33+'return aa;')(db,params);
//			console.log(s33);
			var res = alasql.engines[db.engineid].intoTable(db.databaseid,tableid,aa, null, cb);
//			if(cb) cb(res);
			return res;
		};

    } else {

		var statement = function(params, cb) {
			//console.log(databaseid);
			var db = alasql.databases[databaseid];

			if(alasql.options.autocommit && db.engineid) {
				alasql.engines[db.engineid].loadTableData(databaseid,tableid);
			}
			
			var res = insertfn(db,params,alasql);

			if(alasql.options.autocommit && db.engineid) {
				alasql.engines[db.engineid].saveTableData(databaseid,tableid);
			}
	//		var res = insertfn(db, params);
	        if(alasql.options.nocount) res = undefined;
			if(cb) cb(res);
			return res;
		};
	};

	return statement;
};

yy.Insert.prototype.execute = function (databaseid, params, cb) {
	return this.compile(databaseid)(params,cb);
//	throw new Error('Insert statement is should be compiled')
}




/*
//
// DELETE for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

yy.Delete = function (params) { return yy.extend(this, params); }
yy.Delete.prototype.toString = function() {
	var s = 'DELETE FROM '+this.table.toString();
	if(this.where) s += ' WHERE '+this.where.toString();
	return s;
}

yy.Delete.prototype.compile = function (databaseid) {
//  console.log(11,this);
	databaseid = this.table.databaseid || databaseid;
	var tableid = this.table.tableid;
	var statement;
			var db = alasql.databases[databaseid];



	if(this.where) {

//		console.log(27, this);
//		this.query = {};

		if(this.exists) {
			this.existsfn  = this.exists.map(function(ex) {
				var nq = ex.compile(databaseid);
				nq.query.modifier='RECORDSET';
				return nq;
			});
		}
		if(this.queries) {
			this.queriesfn = this.queries.map(function(q) {
				var nq = q.compile(databaseid);
				nq.query.modifier='RECORDSET';
				return nq;
			});		
		}


//		try {
//		console.log(this, 22, this.where.toJS('r',''));
//	} catch(err){console.log(444,err)};
//		var query = {};
//console.log(this.where.toJS('r',''));
		wherefn = new Function('r,params,alasql','var y;return ('+this.where.toJS('r','')+')').bind(this);
//		console.log(wherefn);
		statement = (function (params, cb) {
			if(db.engineid && alasql.engines[db.engineid].deleteFromTable) {
				return alasql.engines[db.engineid].deleteFromTable(databaseid, tableid, wherefn, params, cb);
			}

			if(alasql.options.autocommit && db.engineid && db.engineid == 'LOCALSTORAGE') {
				alasql.engines[db.engineid].loadTableData(databaseid,tableid);
			}

			var table = db.tables[tableid];
//			table.dirty = true;
			var orignum = table.data.length;

			var newtable = [];			
			for(var i=0, ilen=table.data.length;i<ilen;i++) {
				if(wherefn(table.data[i],params,alasql)) {
					// Check for transaction - if it is not possible then return all back
					if(table.delete) {
						table.delete(i,params,alasql);
					} else {
						// SImply do not push
					}
				} else newtable.push(table.data[i]);
			}
//			table.data = table.data.filter(function(r){return !;});
			table.data = newtable;
			var res = orignum - table.data.length;
			if(alasql.options.autocommit && db.engineid && db.engineid == 'LOCALSTORAGE') {
				alasql.engines[db.engineid].saveTableData(databaseid,tableid);
			}

//			console.log('deletefn',table.data.length);
			if(cb) cb(res);
			return res;
		});
// .bind(query);

// 		if(!this.queries) return;
// 			query.queriesfn = this.queries.map(function(q) {
// 			return q.compile(alasql.useid);
// 		});

	} else {
		statement = function (params, cb) {
			if(alasql.options.autocommit && db.engineid) {
				alasql.engines[db.engineid].loadTableData(databaseid,tableid);
			}

			var table = db.tables[tableid];
			table.dirty = true;
			var orignum = db.tables[tableid].data.length;
			//table.deleteall();
			// Delete all records from the array
			db.tables[tableid].data.length = 0;

			if(alasql.options.autocommit && db.engineid) {
				alasql.engines[db.engineid].saveTableData(databaseid,tableid);
			}

			if(cb) cb(orignum);
			return orignum;
		};
	};

	return statement;

};

yy.Delete.prototype.execute = function (databaseid, params, cb) {
	return this.compile(databaseid)(params,cb);
}
/*
//
// UPDATE for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

yy.Update = function (params) { return yy.extend(this, params); }
yy.Update.prototype.toString = function() {
	var s = 'UPDATE '+this.table.toString();
	if(this.columns) s += ' SET '+this.columns.toString();
	if(this.where) s += ' WHERE '+this.where.toString();
	return s;
}


yy.SetColumn = function (params) { return yy.extend(this, params); }
yy.SetColumn.prototype.toString = function() {
	return this.column.toString() + '='+this.expression.toString();
}

yy.Update.prototype.compile = function (databaseid) {
//	console.log(this);
	databaseid = this.table.databaseid || databaseid;
	var tableid = this.table.tableid;
	
	if(this.where) {
		if(this.exists) {
			this.existsfn  = this.exists.map(function(ex) {
				var nq = ex.compile(databaseid);
				nq.query.modifier='RECORDSET';
				return nq;
			});
		}
		if(this.queries) {
			this.queriesfn = this.queries.map(function(q) {
				var nq = q.compile(databaseid);
				nq.query.modifier='RECORDSET';
				return nq;
			});		
		}

		var wherefn = new Function('r,params,alasql','var y;return '+this.where.toJS('r','')).bind(this);
	};

	// Construct update function
	var s = '';
	this.columns.forEach(function(col){
		s += 'r[\''+col.column.columnid+'\']='+col.expression.toJS('r','')+';'; 
	});
//	console.log('updatefn',s);
	var assignfn = new Function('r,params,alasql','var y;'+s);

	var statement = function(params, cb) {
		var db = alasql.databases[databaseid];


//		console.log(db.engineid);
//		console.log(db.engineid && alasql.engines[db.engineid].updateTable);
		if(db.engineid && alasql.engines[db.engineid].updateTable) {
//			console.log('updateTable');
			return alasql.engines[db.engineid].updateTable(databaseid, tableid, assignfn, wherefn, params, cb);
		}

		if(alasql.options.autocommit && db.engineid) {
			alasql.engines[db.engineid].loadTableData(databaseid,tableid);
		}

		var table = db.tables[tableid];
		if(!table) {
			throw new Error("Table '"+tableid+"' not exists")
		}
//		table.dirty = true;
		var numrows = 0;
		for(var i=0, ilen=table.data.length; i<ilen; i++) {
			if(!wherefn || wherefn(table.data[i], params,alasql) ) {
				if(table.update) {
					table.update(assignfn, i, params);
				} else {
					assignfn(table.data[i], params,alasql);
				}
				numrows++;
			}
		};

		if(alasql.options.autocommit && db.engineid) {
			alasql.engines[db.engineid].saveTableData(databaseid,tableid);
		}

		if(cb) cb(numrows);
		return numrows;
	};
	return statement;
};

yy.Update.prototype.execute = function (databaseid, params, cb) {
	return this.compile(databaseid)(params,cb);
}




/*
//
// SET for Alasql.js
// Date: 01.12.2014
// (c) 2014, Andrey Gershun
//
*/

yy.Merge = function (params) { return yy.extend(this, params); }
yy.Merge.prototype.toString = function() {
	var s = 'MERGE ';
	s += this.into.tableid+' ';
	if(this.into.as) s += 'AS '+this.into.as+' ';
	s += 'USING '+this.using.tableid+' ';
	if(this.using.as) s += 'AS '+this.using.as+' ';
	s += 'ON '+this.on.toString()+' ';
	this.matches.forEach(function(m){
		s += 'WHEN ';
		if(!m.matched) s += 'NOT ';
		s += 'MATCHED ';
		if(m.bytarget) s += 'BY TARGET ';
		if(m.bysource) s += 'BY SOURCE ';
		if(m.expr) s+= 'AND'+' '+m.expr.toString()+' ';
		s += 'THEN ';
		if(m.action.delete) s += 'DELETE ';
		if(m.action.insert) {
			s += 'INSERT ';
			if(m.action.columns) s += '('+m.action.columns.toString()+') ';
			if(m.action.values) s += 'VALUES ('+m.action.values.toString()+') ';
			if(m.action.defaultvalues) s += 'DEFAULT VALUES ';
		}
		if(m.action.update) {
			s += 'UPDATE ';
			s += m.action.update.map(function(u){
				return u.toString();
			}).join(',')+' ';
		}

	});

//	console.log(this);
	return s;
}

yy.Merge.prototype.execute = function (databaseid,params,cb) {
	var res = 1;



	if(cb) res=cb(res);
	return res;
};


/*
//
// UPDATE for Alasql.js
// Date: 03.11.2014
// Modified: 16.11.2014
// (c) 2014, Andrey Gershun
//
*/

// CREATE DATABASE databaseid
yy.CreateDatabase = function (params) { return yy.extend(this, params); };
yy.CreateDatabase.prototype.toString = function() {
	var s = 'CREATE'; 
	if(this.engineid) s+=' '+this.engineid;
	s += ' DATABASE';
	if(this.ifnotexists) s += ' IF NOT EXISTS';
	s += ' '+this.databaseid;
	if(this.args && this.args.length > 0) { 
		s += '('+this.args.map(function(arg){ return arg.toString()}).join(', ')+')';
	}
	if(this.as) s += ' AS '+this.as;
	return s;
}
//yy.CreateDatabase.prototype.compile = returnUndefined;
yy.CreateDatabase.prototype.execute = function (databaseid, params, cb) {
	// console.log(alasql.useid, databaseid, this.databaseid);
	// console.trace();
	var args;
	if(this.args && this.args.length > 0) {
		args = this.args.map(function(arg){
			return new Function('params,alasql','var y;return '+arg.toJS())(params,alasql);
		});
	};
	if(this.engineid) {
		var res = alasql.engines[this.engineid].createDatabase(this.databaseid, this.args, this.ifnotexists, this.as, cb);
		return res;
	} else {
		var dbid = this.databaseid;
		if(alasql.databases[dbid]) {
			throw new Error("Database '"+dbid+"' already exists")
		};
		var a = new alasql.Database(dbid);
		var res = 1;
		if(cb) return cb(res);
		return res;
	}
};

// CREATE DATABASE databaseid
yy.AttachDatabase = function (params) { return yy.extend(this, params); };
yy.AttachDatabase.prototype.toString = function() {
	var s = 'ATTACH';
	if(this.engineid) s += ' '+this.engineid;
	s += ' DATABASE'+' '+this.databaseid;
	// TODO add params
	if(args) {
		s += '(';
			if(args.length>0) {
				s += args.map(function(arg){ return arg.toString(); }).join(', ');
			}
		s += ')';
	}
	if(this.as) s+= ' AS'+' '+this.as;
	return s;
}
//yy.CreateDatabase.prototype.compile = returnUndefined;
yy.AttachDatabase.prototype.execute = function (databaseid, params, cb) {
	// console.log(alasql.useid, databaseid, this.databaseid);
	// console.trace();
	if(!alasql.engines[this.engineid]) {
		throw new Error('Engine "'+this.engineid+'" is not defined.');
	};
	var res = alasql.engines[this.engineid].attachDatabase(this.databaseid, this.as, this.args, params, cb);
	return res;
};


// CREATE DATABASE databaseid
yy.DetachDatabase = function (params) { return yy.extend(this, params); };
yy.DetachDatabase.prototype.toString = function() {
	var s = 'DETACH';
	s += ' DATABASE'+' '+this.databaseid;
	return s;
}
//yy.CreateDatabase.prototype.compile = returnUndefined;
yy.DetachDatabase.prototype.execute = function (databaseid, params, cb) {
	// console.log(alasql.useid, databaseid, this.databaseid);
	// console.trace();
//console.log(89,this,arguments,alasql.databases);

	if(!alasql.databases[this.databaseid].engineid) {
		throw new Error('Cannot detach database "'+this.engineid+'", because it was not attached.');
	};
	var res;
	
	var dbid = this.databaseid;

	if(dbid == alasql.DEFAULTDATABASEID) {
		throw new Error("Drop of default database is prohibited");			
	}
//	console.log(dbid);
	if(!alasql.databases[dbid]) {
		if(!this.ifexists) {
			throw new Error("Database '"+dbid+"' does not exist");	
		} else {
			res = 0;
		}
	} else {
		delete alasql.databases[dbid];
		if(dbid == alasql.useid) {
			alasql.use();		
		}
		res = 1;
	}
	if(cb) cb(res);
	return res;
//	var res = alasql.engines[this.engineid].attachDatabase(this.databaseid, this.as, cb);
//	return res;
};

// USE DATABSE databaseid
// USE databaseid
yy.UseDatabase = function (params) { return yy.extend(this, params); };
yy.UseDatabase.prototype.toString = function() {
	return 'USE' +' '+'DATABASE'+' '+this.databaseid;
}
//yy.UseDatabase.prototype.compile = returnUndefined;
yy.UseDatabase.prototype.execute = function (databaseid, params, cb) {
	var dbid = this.databaseid;
	if(!alasql.databases[dbid]) {
		throw new Error("Database '"+dbid+"' does not exist")
	};
	alasql.use(dbid);
	var res = 1;
	if(cb) cb(res);
	return res;
};

// DROP DATABASE databaseid
yy.DropDatabase = function (params) { return yy.extend(this, params); }
yy.DropDatabase.prototype.toString = function() {
	var s = 'DROP';
	if(this.ifexists) s += ' IF EXISTS';
	s += ' DATABASE '+this.databaseid;
	return s;
}
//yy.DropDatabase.prototype.compile = returnUndefined;
yy.DropDatabase.prototype.execute = function (databaseid, params, cb) {
	if(this.engineid) {

//		console.log(this,this.databaseid, this.ifexists);
		return alasql.engines[this.engineid].dropDatabase(this.databaseid, this.ifexists, cb);
	}
	var res;
	
	var dbid = this.databaseid;

	if(dbid == alasql.DEFAULTDATABASEID) {
		throw new Error("Drop of default database is prohibited");			
	}
//	console.log(dbid);
	if(!alasql.databases[dbid]) {
		if(!this.ifexists) {
			throw new Error("Database '"+dbid+"' does not exist");	
		} else {
			res = 0;
		}
	} else {
		if(alasql.databases[dbid].engineid) {
			throw new Error("Cannot drop database '"+dbid+"', because it is attached. Detach it.");	
		}

		delete alasql.databases[dbid];
		if(dbid == alasql.useid) {
			alasql.use();		
		}
		res = 1;
	}
	if(cb) cb(res);
	return res;
};






/*
//
// SET for Alasql.js
// Date: 01.12.2014
// (c) 2014, Andrey Gershun
//
*/

yy.Declare = function (params) { return yy.extend(this, params); }
yy.Declare.prototype.toString = function() {
	var s = 'DECLARE ';
	if(this.declares && this.declares.length > 0) {
		s = this.declares.map(function(declare){
			var s = '';
			s += '@'+declare.variable+' ';
			s += declare.dbtypeid;
			if(this.dbsize) s += '('+this.dbsize;
			if(this.dbprecision) s+= ','+this.dbprecision;
			s += ')';
			if(declare.expression) s += ' = '+declare.expression.toString();
			return s;
		}).join(',');
	}
	return s;
}

yy.Declare.prototype.execute = function (databaseid,params,cb) {
	var res = 1;
	if(this.declares && this.declares.length > 0) {
		this.declares.map(function(declare){
			var dbtypeid = declare.dbtypeid;
			if(!alasql.fn[dbtypeid]) dbtypeid = dbtypeid.toUpperCase();

			alasql.declares[declare.variable] = {dbtypeid:dbtypeid,
				dbsize:declare.dbsize, dbprecision:declare.dbprecision};

			// Set value
			if(declare.expression) {
	//		console.log(this.expression.toJS('','', null));
				alasql.vars[declare.variable] = new Function("params,alasql","return "
					+declare.expression.toJS('({})','', null))(params,alasql);
				if(alasql.declares[declare.variable]) {
					alasql.vars[declare.variable] = alasql.stdfn.CONVERT(alasql.vars[declare.variable],alasql.declares[declare.variable]);
				}
			};
		});
	};
	if(cb) res=cb(res);
	return res;
};


/*
//
// SHOW for Alasql.js
// Date: 19.11.2014
// (c) 2014, Andrey Gershun
//
*/

yy.ShowDatabases = function (params) { return yy.extend(this, params); }
yy.ShowDatabases.prototype.toString = function() {
	var s = 'SHOW DATABASES';
	if(this.like) s += 'LIKE '+this.like.toString();
	return s;
}
yy.ShowDatabases.prototype.execute = function (databaseid, params, cb) {
	if(this.engineid) {
		return alasql.engines[this.engineid].showDatabases(this.like, cb);
	} else {
		var self = this;
		var res = [];
		for(dbid in alasql.databases) {
			res.push({databaseid: dbid});
		};
		if(self.like && res && res.length > 0) {
			res = res.filter(function(d){
//				return d.databaseid.match(new RegExp((self.like.value||'').replace(/\%/g,'.*').replace(/\?|_/g,'.'),'g'));
				return alasql.utils.like(self.like.value,d.databaseid);
			});
		}
		if(cb) cb(res);
		return res;
	};

};


yy.ShowTables = function (params) { return yy.extend(this, params); }
yy.ShowTables.prototype.toString = function() {
	var s = 'SHOW TABLES';
	if(this.databaseid) s += ' FROM '+this.databaseid;
	if(this.like) s += ' LIKE '+this.like.toString();
	return s;
}
yy.ShowTables.prototype.execute = function (databaseid, params, cb) {
	var db = alasql.databases[this.databaseid || databaseid];

	var self = this;
	var res = [];
	for(tableid in db.tables) {
		res.push({tableid: tableid});
	};
	if(self.like && res && res.length > 0) {
		res = res.filter(function(d){
			//return d.tableid.match(new RegExp((self.like.value||'').replace(/\%/g,'.*').replace(/\?|_/g,'.'),'g'));
			return alasql.utils.like(self.like.value,d.tableid);
		});
	};
	if(cb) cb(res);
	return res;
};

yy.ShowColumns = function (params) { return yy.extend(this, params); }
yy.ShowColumns.prototype.toString = function() {
	var s = 'SHOW COLUMNS';
	if(this.table.tableid) s += ' FROM '+this.table.tableid;
	if(this.databaseid) s += ' FROM '+this.databaseid;
	return s;
};

yy.ShowColumns.prototype.execute = function (databaseid) {
	var db = alasql.databases[this.databaseid || databaseid];
	var table = db.tables[this.table.tableid];
	var self = this;
	if(table && table.columns) {
		var res = table.columns.map(function(col){
			return {columnid: col.columnid, dbtypeid: col.dbtypeid, dbsize: col.dbsize};
		});
		return res;
	} else {
		return [];
	}
};

yy.ShowIndex = function (params) { return yy.extend(this, params); }
yy.ShowIndex.prototype.toString = function() {
	var s = 'SHOW INDEX';
	if(this.table.tableid) s += ' FROM '+this.table.tableid;
	if(this.databaseid) s += ' FROM '+this.databaseid;
	return s;
}
yy.ShowIndex.prototype.execute = function (databaseid) {
	var db = alasql.databases[this.databaseid || databaseid];
	var table = db.tables[this.table.tableid];
	var self = this;
	var res = [];
	if(table && table.indices) {
		for(var ind in table.indices) {
			res.push({hh:ind, len:Object.keys(table.indices[ind]).length});
		}
	}
	return res;
};

yy.ShowCreateTable = function (params) { return yy.extend(this, params); }
yy.ShowCreateTable.prototype.toString = function() {
	var s = 'SHOW CREATE TABLE '+this.table.tableid;
	if(this.databaseid) s += ' FROM '+this.databaseid;
	return s;
}
yy.ShowCreateTable.prototype.execute = function (databaseid) {
	var db = alasql.databases[this.databaseid || databaseid];
	var table = db.tables[this.table.tableid];
	var self = this;
	if(table) {
		var s = 'CREATE TABLE '+this.table.tableid+' (';
		var ss = [];
		if(table.columns) {
			table.columns.forEach(function(col){
				var a = col.columnid+' '+col.dbtypeid;
				if(col.dbsize) a += '('+col.dbsize+')';
				if(col.primarykey) a += ' PRIMARY KEY';
				// TODO extend
				ss.push(a); 
			});
			s += ss.join(', ');
		};
		s += ')';
		return s;
	} else {
		throw new Error('There is no such table "'+this.table.tableid+'"');
	}
};

/*
//
// SET for Alasql.js
// Date: 01.12.2014
// (c) 2014, Andrey Gershun
//
*/

yy.SetVariable = function (params) { return yy.extend(this, params); }
yy.SetVariable.prototype.toString = function() {
	var s = 'SET ';
	if(typeof this.value != 'undefined') s += this.variable.toUpperCase()+' '+(this.value?'ON':'OFF');
	if(this.expression) s += this.method + this.variable+' = '+this.expression.toString();
	return s;
}

yy.SetVariable.prototype.execute = function (databaseid,params,cb) {
//	console.log(this);
	if(typeof this.value != 'undefined') {
		var val = this.value;
		if(val == 'ON') val = true;
		else if(val == 'OFF') val = false;
//		if(this.method == '@') {
			alasql.options[this.variable] = val;
//		} else {
//			params[this.variable] = val;
//		}
	} else if(this.expression) {

		if(this.exists) {
			this.existsfn = this.exists.map(function(ex) {
				var nq = ex.compile(databaseid);
				if(nq.query && !nq.query.modifier) nq.query.modifier='RECORDSET';
				return nq;
//				return ex.compile(databaseid);
				// TODO Include modifier
			});
		}
		if(this.queries) {
			this.queriesfn = this.queries.map(function(q) {
				var nq = q.compile(databaseid);
				if(nq.query && !nq.query.modifier) nq.query.modifier='RECORDSET';
				return nq;
				// TODO Include modifier
			});		
		}

//		console.log(this.expression.toJS('','', null));
		var res = new Function("params,alasql","return "
			+this.expression.toJS('({})','', null)).bind(this)(params,alasql);
		if(alasql.declares[this.variable]) {
			res = alasql.stdfn.CONVERT(res,alasql.declares[this.variable]);
		}
		if(this.props && this.props.length > 0) {
			if(this.method == '@') {
				var fs = 'alasql.vars[\''+this.variable+'\']';
			} else {
				var fs = 'params[\''+this.variable+'\']';
			}
			fs += this.props.map(function(prop){
				if(typeof prop == 'string') {
					return '[\''+prop+'\']';
				} else if(typeof prop == 'number') {
					return '['+prop+']';
				} else {
					// console.log('prop:',prop, prop.toJS());
					return '['+prop.toJS()+']';
//				} else {
//					console.log(prop, typeof );
//					throw new Error('Wrong SET property');
				}
			}).join();
//				console.log(fs);
			new Function("value,params,alasql",'var y;'+fs +'=value')(res,params,alasql);
		} else {
			if(this.method == '@') {
				alasql.vars[this.variable] = res;
			} else {
				params[this.variable] = res;
			}
		}
	}
	var res = 1;
	if(cb) res=cb(res);
	return res;
};


// Console functions
/*
alasql.con = {
	results:{}
};

alasql.con.open = function(el) {
	// For browser only
	if(typeof exports === 'object') return;

	// Find parent element
	el = el || document.getElementById('alasql-con') || document.getElementsByTagName('body');
	if(!el) {throw new Error('Cannot fid element for console.')}

	var conel = document.createElement('div');
	conel.style.width = "1000px";
	conel.style.height = "320px";

	alasql.con.conel = conel;

	var lenta = document.createElement('div');
	lenta.style.width = "1000px";
	lenta.style.height = "200px";
	lenta.style.overflow = "scroll";
	alasql.con.lenta = lenta;

	var inpel = document.createElement('div');
	inpel.style.width = "1000px";
	inpel.style.height = "100px";
	inpel.style.contentEditable = true;
	inpel.innerHTML = 'command ';
	alasql.con.inpel = inpel;

	conel.appendChild(lenta);
	conel.appendChild(inpel);
	el.appendChild(conel);
};

alasql.con.clear = function() {
	// For browser only
	if(typeof exports === 'object') return;

	alasql.con.conel.innerHTML = '';
};

alasql.con.close = function() {
	// For browser only
	if(typeof exports === 'object') return;

	alasql.con.conel.removeChild(alasql.con.lenta);
	alasql.con.conel.removeChild(alasql.con.inel);
	alasql.con.conel.parentElement.removeChild(conel);
};

alasql.con.log = function() {
		// For browser only
	if(typeof exports === 'object') {
		console.log.bind(console).apply(this, arguments);
	} else {
		var s = '<div>';
		s += Array.prototype.slice.call(arguments, 0).map(function(arg){
			return arg.toString();
		}).join(' ');
		s += '</div>';
		alasql.con.conel.innerHTML += s;
	};

};
*/
alasql.test = function(name, times, fn) {
	if(arguments.length === 0) {
		alasql.log(alasql.con.results);
		return;
	} else if(arguments.length === 1) {
		var tm = Date.now();
		fn();
		alasql.con.log(Date.now()-tm);
		return;
	} 

	if(arguments.length === 2) {
		fn = times;
		times = 1;
	}

	var tm = Date.now();
	for(var i=0;i<times;i++){
		fn();
	}
	alasql.con.results[name] = Date.now()-tm;
};

// Console
// alasql.log = function(sql, params) {
// 	var res;
// 	if(typeof sql == "string") {
// 		res = alasql(sql, params);
// 	} else {
// 		res = sql;
// 	};
// 	if(res instanceof Array) {
// 		if(console.table) {
// 			console.table(res);		
// 		} else {
// 			console.log(res);
// 		}
// 	} else {
// 		console.log(res);				
// 	}
// };

// Console
alasql.log = function(sql, params) {
	var olduseid = alasql.useid;
	var target = alasql.options.logtarget;
	// For node other
	if(typeof exports === 'object') {
		target = 'console';
	}

	var res;
	if(typeof sql === "string") {
		res = alasql(sql, params);
	} else {
		res = sql;
	}

	// For Node and console.output
	if(target === 'console' || typeof exports === 'object') {
		if(typeof sql === 'string' && alasql.options.logprompt){
			console.log(olduseid+'>',sql);
		}

		if(res instanceof Array) {
			if(console.table) {
				// For Chrome and other consoles
				console.table(res);		
			} else {
				// Add print procedure
				console.log(JSONtoString(res));
			}
		} else {
			console.log(JSONtoString(res));				
		}

	} else {
		var el;
		if(target === 'output') {
			el = document.getElementsByTagName('output')[0];
		} else {
			if(typeof target === 'string') {
				el = document.getElementById(target);
			} else {
				// in case of DOM
				el = target;
			}

		}

		var s = '';

		if(typeof sql === 'string' && alasql.options.logprompt) {
//			s += '<p>'+olduseid+'&gt;&nbsp;'+alasql.pretty(sql)+'</p>';
			s += '<pre><code>'+alasql.pretty(sql)+'</code></pre>';
		}

		if(res instanceof Array) {
			if(res.length === 0) {
				s += '<p>[ ]</p>'
			} else if(typeof res[0] !== 'object' || res[0] instanceof Array) {
				for(var i=0,ilen=res.length;i<ilen;i++) {
					s += '<p>'+loghtml(res[i])+'</p>';
				}
			} else {
				s += loghtml(res);
			}
		} else {
			s += loghtml(res);
		}
		el.innerHTML += s;
	}
};

alasql.clear = function() {
	var target = alasql.options.logtarget;
	// For node other
	if(typeof exports === 'object') {
		target = 'console';
	}

	if(target === 'console' || typeof exports === 'object') {
		if(console.clear) {
			console.clear();
		} 
		
		// todo: handle Node
		
	} else {
		var el;
		if(target === 'output') {
			el = document.getElementsByTagName('output')[0];
		} else {
			if(typeof target === 'string') {
				el = document.getElementById(target);
			} else {
				// in case of DOM
				el = target;
			}
		}
		el.innerHTML = '';		
	}
}

alasql.write = function(s) {
//	console.log('write',s);
	var target = alasql.options.logtarget;
	// For node other
	if(typeof exports === 'object') {
		target = 'console';
	}

	if(target === 'console' || typeof exports === 'object') {
		if(console.log) {
			console.log(s);
		} 

		// todo: handle node

	} else {
		var el;
		if(target === 'output') {
			el = document.getElementsByTagName('output')[0];
		} else {
			if(typeof target === 'string') {
				el = document.getElementById(target);
			} else {
				// in case of DOM
				el = target;
			}
		}
		el.innerHTML += s;		
	}
}

function loghtml(res) {
//	console.log(res); 
	var s  = '';
	if(res === undefined) {
		s += 'undefined';
	} else if(res instanceof Array) {
		s += '<style>';
		s += 'table {border:1px black solid; border-collapse: collapse; border-spacing: 0px;}';
		s += 'td,th {border:1px black solid; padding-left:5px; padding-right:5px}';
		s += 'th {background-color: #EEE}';
		s += '</style>';
		s += '<table>';
		var cols = [];			
		for(var colid in res[0]) {
			cols.push(colid);
		}
		s += '<tr><th>#';
		cols.forEach(function(colid){
			s += '<th>'+colid;
		});
		for(var i=0,ilen=res.length;i<ilen;i++) {
			s += '<tr><th>'+(i+1);
			cols.forEach(function(colid){
				s += '<td> ';
				if(+res[i][colid] === +res[i][colid]) {
					s += '<div style="text-align:right">';
					if(typeof res[i][colid] === 'undefined'){
						s += 'NULL';
					} else {
						s += res[i][colid];
					}
					s += '</div>';
				} else {
					if(typeof res[i][colid] === 'undefined') {
						s += 'NULL';
					} else if(typeof res[i][colid] === 'string') {
						s += res[i][colid];
					} else { 
						s += JSONtoString(res[i][colid]);
					}
//					s += res[i][colid];
				}
			});
		}

		s += '</table>';
	} else {
		s += '<p>'+JSONtoString(res)+'</p>';
	}
		// if() {}

		// 		if(typeof res == 'object') {
		// 			s += '<p>'+JSON.stringify(res)+'</p>';
		// 		} else {
		// 		}
	return s;
}



function scrollTo(element, to, duration) {
    if(duration <= 0){
    	return;
    }
    var difference = to - element.scrollTop;
    var perTick = difference / duration * 10;

    setTimeout(function() {
        if(element.scrollTop===to){
        	return;
        }
        element.scrollTop = element.scrollTop + perTick;
        scrollTo(element, to, duration - 10);
    }, 10);
}

alasql.prompt = function(el, useidel, firstsql) {
	if(typeof exports === 'object') {
		throw new Error('The functionality of prompt is not realized for Node.js');
	}

	var prompti = 0;

	if(typeof el === 'string'){
		el = document.getElementById(el);
	}

	if(typeof useidel === 'string'){
		useidel = document.getElementById(useidel);
	}

	useidel.textContent = alasql.useid;

	if(firstsql) {
		alasql.prompthistory.push(firstsql);
		prompti = alasql.prompthistory.length;
		try {
			var tm = Date.now();
			alasql.log(firstsql);
			alasql.write('<p style="color:blue">'+(Date.now()-tm)+' ms</p>');
		} catch (err) {
			alasql.write('<p>'+olduseid+'&gt;&nbsp;<b>'+sql+'</b></p>');
			alasql.write('<p style="color:red">'+err+'<p>');
		}
	}

	var y = el.getBoundingClientRect().top + document.getElementsByTagName('body')[0].scrollTop;
	scrollTo(document.getElementsByTagName('body')[0],y,500);

	el.onkeydown = function(event) {
		if(event.which === 13) {
			var sql = el.value;
			var olduseid = alasql.useid;
			el.value = '';
			alasql.prompthistory.push(sql);
			prompti = alasql.prompthistory.length;
			try {
				var tm = Date.now();
				alasql.log(sql);
				alasql.write('<p style="color:blue">'+(Date.now()-tm)+' ms</p>');
			} catch (err) {
				alasql.write('<p>'+olduseid+'&gt;&nbsp;'+alasql.pretty(sql, false)+'</p>');
				alasql.write('<p style="color:red">'+err+'<p>');
			}
			el.focus();
//			console.log(el.getBoundingClientRect().top);
			useidel.textContent = alasql.useid;
			var y = el.getBoundingClientRect().top + document.getElementsByTagName('body')[0].scrollTop;
			scrollTo(document.getElementsByTagName('body')[0],y,500);
		} else if(event.which === 38) {
			prompti--; if(prompti<0){
				prompti = 0;
			}
			if(alasql.prompthistory[prompti]) {
				el.value = alasql.prompthistory[prompti];
				event.preventDefault();
			}

		} else if(event.which === 40) {
			prompti++; 
			if(prompti>=alasql.prompthistory.length) {
				prompti = alasql.prompthistory.length;
				el.value = '';
			} else if(alasql.prompthistory[prompti]) {
				el.value = alasql.prompthistory[prompti];
				event.preventDefault();
			}
		}

	}
}




/*
//
// Commit for Alasql.js
// Date: 01.12.2014
// (c) 2014, Andrey Gershun
//
*/
yy.BeginTransaction = function (params) { return yy.extend(this, params); }
yy.BeginTransaction.prototype.toString = function() {
	return 'BEGIN TRANSACTION';
}

yy.BeginTransaction.prototype.execute = function (databaseid,params, cb) {
	var res = 1;
	if(alasql.databases[databaseid].engineid) {
		return alasql.engines[alasql.databases[alasql.useid].engineid].begin(databaseid, cb);
	} else {
		// alasql commit!!!
	}
	if(cb) cb(res);
	return res;
};

yy.CommitTransaction = function (params) { return yy.extend(this, params); }
yy.CommitTransaction.prototype.toString = function() {
	return 'COMMIT TRANSACTION';
}

yy.CommitTransaction.prototype.execute = function (databaseid,params, cb) {
	var res = 1;
	if(alasql.databases[databaseid].engineid) {
		return alasql.engines[alasql.databases[alasql.useid].engineid].commit(databaseid, cb);
	} else {
		// alasql commit!!!
	}
	if(cb) cb(res);
	return res;
};

yy.RollbackTransaction = function (params) { return yy.extend(this, params); }
yy.RollbackTransaction.prototype.toString = function() {
	return 'ROLLBACK TRANSACTION';
}

yy.RollbackTransaction.prototype.execute = function (databaseid,params,cb) {
	var res = 1;
	if(alasql.databases[databaseid].engineid) {
		return alasql.engines[alasql.databases[databaseid].engineid].rollback(databaseid, cb);
	} else {
		// alasql commit!!!
	}
	if(cb) cb(res);
	return res;
};

if(alasql.options.tsql) {


//
// Check tables and views
// IF OBJECT_ID('dbo.Employees') IS NOT NULL
//   DROP TABLE dbo.Employees;
  // IF OBJECT_ID('dbo.VSortedOrders', 'V') IS NOT NULL
//   DROP VIEW dbo.VSortedOrders;

alasql.stdfn.OBJECT_ID = function(name,type) {
	if(typeof type == 'undefined') type = 'T';
	type = type.toUpperCase();

	var sname = name.split('.');
	var dbid = alasql.useid;
	var objname = sname[0];
	if(sname.length == 2) {
		dbid = sname[0];
		objname = sname[1];
	}

	var tables = alasql.databases[dbid].tables;
	dbid = 	alasql.databases[dbid].databaseid;
	for(var tableid in tables) {
		if(tableid == objname) {
			// TODO: What OBJECT_ID actually returns

			if(tables[tableid].view && type == 'V') return dbid+'.'+tableid;
			if(!tables[tableid].view && type == 'T') return dbid+'.'+tableid;
			return undefined;
		}
	}

	return undefined;
};

}


if(alasql.options.mysql) {



}

if(alasql.options.mysql || alasql.options.sqlite) {

// Pseudo INFORMATION_SCHEMA function
alasql.from.INFORMATION_SCHEMA = function(filename, opts, cb, idx, query) {
	if(filename == 'VIEWS' || filename == 'TABLES' ) {
		var res = [];
		for(var databaseid in alasql.databases) {			
			var tables = alasql.databases[databaseid].tables;
			for(var tableid in tables) {
				if((tables[tableid].view && filename == 'VIEWS') ||
					(!tables[tableid].view && filename == 'TABLES')) {
					res.push({TABLE_CATALOG:databaseid,TABLE_NAME:tableid});
				}
			}
		}
		if(cb) res = cb(res, idx, query);
		return res;		
	}
	throw new Error('Unknown INFORMATION_SCHEMA table');
}

}
if(alasql.options.postgres) {
}
if(alasql.options.oracle) {
}
if(alasql.options.sqlite) {
}
//
// into functions
//
// (c) 2014 Andrey Gershun
//

alasql.into.SQL = function(filename, opts, data, columns, cb) {
	var res;
	if(typeof filename == 'object') {
		opts = filename;
		filename = undefined;
	}
	var opt = {};
	alasql.utils.extend(opt, opts);
	if(typeof opt.tableid == 'undefined') {
		throw new Error('Table for INSERT TO is not defined.');
	};

	var s = '';
	if(columns.length == 0) {
		if(typeof data[0] == "object") {
			columns = Object.keys(data[0]).map(function(columnid){return {columnid:columnid}});
		} else {
			// What should I do?
			// columns = [{columnid:"_"}];
		}
	}

	for(var i=0,ilen=data.length;i<ilen;i++) {
		s += 'INSERT INTO '+opts.tableid +'(';
		s += columns.map(function(col){return col.columnid}).join(",");
		s += ') VALUES (';
		s += columns.map(function(col){
			var val = data[i][col.columnid];
			if(col.typeid) {
				if(col.typeid == 'STRING' || col.typeid == 'VARCHAR' ||  
					col.typeid == 'NVARCHAR' || col.typeid == 'CHAR' || col.typeid == 'NCHAR') {
					val = "'"+escapeqq(val)+"'";
				}
			} else {
				if(typeof val == 'string') {
					val = "'"+escapeqq(val)+"'";					
				}
			}
			return val;
		});		
		s += ');\n';
	}
//	if(filename === '') {
//		res = s;
//	} else {
//		res = data.length;
	res = alasql.utils.saveFile(filename,s);
	if(cb) res = cb(res);
	return res;
};

alasql.into.HTML = function(selector, opts, data, columns, cb) {
	var res = 1;
	if(typeof exports != 'object') {
		var opt = {};
		alasql.utils.extend(opt, opts);

		var sel = document.querySelector(selector);
		if(!sel) {
			throw new Error('Selected HTML element is not found');
		};	

		if(columns.length == 0) {
			if(typeof data[0] == "object") {
				columns = Object.keys(data[0]).map(function(columnid){return {columnid:columnid}});
			} else {
				// What should I do?
				// columns = [{columnid:"_"}];
			}
		}

		var tbe = document.createElement('table');
		var thead = document.createElement('thead');
		tbe.appendChild(thead);
		if(opt.headers) {
			var tre = document.createElement('tr');
			for(var i=0;i<columns.length;i++){
				var the = document.createElement('th');
				the.textContent = columns[i].columnid;
				tre.appendChild(the);
			}
			thead.appendChild(tre);
		}

		var tbody = document.createElement('tbody');
		tbe.appendChild(tbody);
		for(var j=0;j<data.length;j++){
			var tre = document.createElement('tr');
			for(var i=0;i<columns.length;i++){
				var the = document.createElement('td');
				the.textContent = data[j][columns[i].columnid];
				tre.appendChild(the);
			}
			tbody.appendChild(tre);
		};
		alasql.utils.domEmptyChildren(sel);
//		console.log(tbe,columns);
		sel.appendChild(tbe);
	}
	if(cb) res = cb(res);
	return res;
};

alasql.into.JSON = function(filename, opts, data, columns, cb) {
	var res = 1;
	if(typeof filename == 'object') {
		opts = filename;
		filename = undefined;
	}
	var opt = {};
	var s = JSON.stringify(data);

	res = alasql.utils.saveFile(filename,s);
	if(cb) res = cb(res);
	return res;
};

alasql.into.TXT = function(filename, opts, data, columns, cb) {
	// If columns is empty
	if(columns.length == 0 && data.length > 0) {
		columns = Object.keys(data[0]).map(function(columnid){return {columnid:columnid}});
	};
	// If one parameter
	if(typeof filename == 'object') {
		opts = filename;
		filename = undefined;
	};

	var res = data.length;
	var s = '';
	if(data.length > 0) {
		var key = columns[0].columnid;
		s += data.map(function(d){
			return d[key];
		}).join('\n');
	}

//	} else {
//		if(typeof exports == 'object') {
//			process.stdout.write(s);
//		} else {
//		console.log(s);
//		};
//	}
	res = alasql.utils.saveFile(filename,s);
	if(cb) res = cb(res);
	return res;
};

alasql.into.TAB = alasql.into.TSV = function(filename, opts, data, columns, cb) {
	var opt = {};
	alasql.utils.extend(opt, opts);
	opt.separator = '\t';
	return alasql.into.CSV(filename, opt, data, columns, cb);
}

alasql.into.CSV = function(filename, opts, data, columns, cb) {
	if(columns.length == 0 && data.length > 0) {
		columns = Object.keys(data[0]).map(function(columnid){return {columnid:columnid}});
	}
	if(typeof filename == 'object') {
		opts = filename;
		filename = undefined;
	}

	var opt = {};
	//opt.separator = ','; 
  opt.separator = ';';
	opt.quote = '"';
	alasql.utils.extend(opt, opts);
	var res = data.length;
	var s = opt.quote;
	if(opt.headers) {
		s += columns.map(function(col){
			return col.columnid.trim();
		}).join(opt.quote+opt.separator+opt.quote)+opt.quote+'\r\n';
	}

	data.forEach(function(d, idx){
		s += columns.map(function(col){
			var s = d[col.columnid];
			s = (s+"").replace(new RegExp('\\'+opt.quote,"g"),'""');
			//if((s+"").indexOf(opt.separator) > -1 || (s+"").indexOf(opt.quote) > -1) s = opt.quote + s + opt.quote; 
      
      //Excel 2013 needs quotes around strings - thanks for _not_ complying with RFC for CSV 
      if(+s!=s){  // jshint ignore:line
          s = opt.quote + s + opt.quote; 
      }
			
      return s;
		}).join(opt.separator)+'\r\n';	
	});

	res = alasql.utils.saveFile(filename,s);
	if(cb) res = cb(res);
	return res;
};



//
// 831xl.js - Coloring Excel
// 18.04.2015
// Generate XLS file with colors and styles
// with Excel

alasql.into.XLS = function(filename, opts, data, columns, cb) {
	// If filename is not defined then output to the result
	if(typeof filename == 'object') {
		opts = filename;
		filename = undefined;
	}

	// Set sheets
	var sheets = {};
	if(opts && opts.sheets) {
		sheets = opts.sheets;
	};

	// Default sheet
	var sheet = {};
	if(typeof sheets['Sheet1'] != 'undefined') {
		sheet = sheets[0];
	} else {
		if(typeof opts != 'undefined') {
			sheet = opts;
		}
	};

	// Set sheet name and default is 'Sheet1'
	if(typeof sheet.sheetid == 'undefined') {
		sheet.sheetid = 'Sheet1';
	};
	
	var s = toHTML();

	// File is ready to save
	var res = alasql.utils.saveFile(filename,s);
	if(cb) res = cb(res);
	return res;

	function toHTML() {
	// Generate prologue
		var s = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" \
		xmlns="http://www.w3.org/TR/REC-html40"><head> \
		<meta charset="utf-8" /> \
		<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets> ';

		// Worksheets
		s+=' <x:ExcelWorksheet><x:Name>' + sheet.sheetid + '</x:Name><x:WorksheetOptions><x:DisplayGridlines/>     </x:WorksheetOptions> \
		</x:ExcelWorksheet>';

		s += '</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';

		// Generate body
		s += '<body';
		if(typeof sheet.style != 'undefined') {
			s += ' style="';
			if(typeof sheet.style == 'function') {
				s += sheet.style(sheet);
			} else {
				s += sheet.style;
			}
			s += '"';
		}
		s +='>';
		s += '<table>';
		if(typeof sheet.caption != 'undefined') {
			var caption = sheet.caption;
			if(typeof caption == 'string') {
				caption = {title:caption};
			}
			s += '<caption';
			if(typeof caption.style != 'undefined') {
				s += ' style="';
				if(typeof caption.style == 'function') {
					s += caption.style(sheet,caption);
				} else {
					s += caption.style;
				}
				s += '" '
			}
			s += '>';
			s += caption.title;
			s += '</caption>';
		}

		// Columns

//		var columns = [];

		// If columns defined in sheet, then take them
		if(typeof sheet.columns != 'undefined') {
			columns = sheet.columns;
		} else {
			// Autogenerate columns if they are passed as parameters
			if(columns.length == 0 && data.length > 0) {
				if(typeof data[0] == 'object') {
					if(data[0] instanceof Array) {
						columns = data[0].map(function(d,columnidx){
							return {columnid:columnidx};
						});
					} else {
						columns = Object.keys(data[0]).map(function(columnid){
							return {columnid:columnid};
						});
					}
				}
			}
		};

		// Prepare columns
		columns.forEach(function(column,columnidx){
			if(typeof sheet.column != 'undefined') {
				extend(column,sheet.column);
			}

			if(typeof column.width == 'undefined') {
				if(sheet.column && sheet.column.width !='undefined') {
					column.width = sheet.column.width;
				
				} else {
					column.width = "120px";
				}
			}
			if(typeof column.width == 'number') column.width = column.width + "px";
			if(typeof column.columnid == 'undefined') column.columnid = columnidx;
			if(typeof column.title == 'undefined') column.title = ""+column.columnid.trim();
			if(sheet.headers && sheet.headers instanceof Array) column.title = sheet.headers[idx];
		});

		// Set columns widths
		s += '<colgroups>';
		columns.forEach(function (column) {
			s += '<col style="width: '+column.width+'"></col>';
		});
		s += '</colgroups>';

		// Headers
		if(sheet.headers) {
		 	s += '<thead>';
		 	s += '<tr>';

			// TODO: Skip columns to body

			// Headers
			columns.forEach(function (column,columnidx) {

				s += '<th ';
				// Column style
				if(typeof column.style != 'undefined') {
					s += ' style="';
					if(typeof column.style == 'function') {
						s += column.style(sheet,column,columnidx);
					} else {
						s += column.style;
					}
					s += '" '
				}
				s += '>';

				// Column title
				if(typeof column.title != 'undefined') {
					if(typeof column.title == 'function') {
						s += column.title(sheet,column,columnidx);
					} else {
						s += column.title;
					}
				}
				s += '</th>';
			});	

			s += '</tr>';	
			s += '</thead>';
		}

		s += '<tbody>';

		// TODO: Skip lines between header and body

		if(data && data.length > 0) {

			// TODO: Skip columns to body

			// Loop over data rows
			data.forEach(function(row,rowidx){
				// Limit number of rows on the sheet
				if(rowidx>sheet.limit) return;
				// Create row
				s += '<tr';

				var srow = {};
				extend(srow,sheet.row);
				if(sheet.rows && sheet.rows[rowidx]) {
					extend(srow,sheet.rows[rowidx]);
				}
				// Row style fromdefault sheet
				if(typeof srow != 'undefined') {
					if(typeof srow.style != 'undefined') {
						s += ' style="';
						if(typeof srow.style == 'function') {
							s += srow.style(sheet,row,rowidx);
						} else {
							s += srow.style;
						}
						s += '" '
					}
				};
				s += '>';
				// Loop over columns
				columns.forEach(function (column,columnidx) {
					// Parameters
					var cell = {};
					extend(cell,sheet.cell);
					extend(cell,srow.cell);
					if(typeof sheet.column != 'undefined') {
						extend(cell,sheet.column.cell);
					}
					extend(cell,column.cell);
					if(sheet.cells && sheet.cells[rowidx] && sheet.cells[rowidx][columnidx]) {
						extend(cell,sheet.cells[rowidx][columnidx]);
					};

					// Create value
					var value = row[column.columnid];
					if(typeof cell.value == 'function') {
						value = cell.value(value,sheet,row,column,cell,rowidx,columnidx);
					}

					// Define cell type
					var typeid = cell.typeid;
					if(typeof typeid == 'function') {
						typeid = typeid(value,sheet,row,column,cell,rowidx,columnidx);
					}

					if(typeof typeid == 'undefined') {
						if(typeof value == 'number') typeid = 'number';
						else if(typeof value == 'string') typeid = 'string';
						else if(typeof value == 'boolean') typeid = 'boolean';
						else if(typeof value == 'object') {
							if(value instanceof Date) typeid = 'date';
						}
					};

					var typestyle = '';

					if(typeid == 'money') {
						typestyle = 'mso-number-format:\"\\#\\,\\#\\#0\\\\ _р_\\.\";white-space:normal;';
					} else if(typeid == 'number') {
						typestyle = ' ';
					} else if (typeid == 'date') {
						typestyle = 'mso-number-format:\"Short Date\";'; 
					} else {
						// FOr other types is saved
						if( opts.types && opts.types[typeid] && opts.types[typeid].typestyle) {
							typestyle = opts.types[typeid].typestyle;
						} 
					}

					// TODO Replace with extend...
					typestyle = typestyle || 'mso-number-format:\"\\@\";'; // Default type style

					s += "<td style='" + typestyle+"' " ;
					if(typeof cell.style != 'undefined') {
						s += ' style="';
						if(typeof cell.style == 'function') {
							s += cell.style(value,sheet,row,column,rowidx,columnidx);
						} else {
							s += cell.style;
						}
						s += '" '
					}
					s += '>';

					// TODO Replace with extend...
					var format = cell.format;
					if(typeof value == 'undefined') {
						s += '';
					} else if(typeof format != 'undefined') {
						if(typeof format == 'function') {
							s += format(value);
						} else if(typeof format == 'string') {
							s += value; // TODO - add string format
						} else {
							throw new Error('Unknown format type. Should be function or string');
						}
					} else {
						if(typeid == 'number' || typeid == 'date') {
							s += value.toString();
						} else if(typeid == 'money') {
							s += (+value).toFixed(2);
						} else {
							s += value;
						}
					}
					s += '</td>';
				});

				s += '</tr>';
			});
		}

		s += '</tbody>';

		// Generate epilogue
		s += '</table>';
		s += '</body>';
		s += '</html>';

		return s;

	}

	// Style function
	function style(a) {
		var s = ' style="';
		if(a && typeof a.style != 'undefined') {
			s += a.style + ';';
		}
		s += '" ';
		return s;
	}
};



alasql.into.XLSXML = function(filename, opts, data, columns, cb) {
	// If filename is not defined then output to the result
	if(typeof filename == 'object') {
		opts = filename;
		filename = undefined;
	}

	// Set sheets
	var sheets = {};
	if(opts && opts.sheets) {
		sheets = opts.sheets;
	} else {
		sheets.Sheet1 = opts;
	};

	// File is ready to save
	var res = alasql.utils.saveFile(filename,toXML());
	if(cb) res = cb(res);
	return res;

	function toXML() {
		var s1 = '<?xml version="1.0"?> \
		<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" \
		 xmlns:o="urn:schemas-microsoft-com:office:office" \
		 xmlns:x="urn:schemas-microsoft-com:office:excel" \
		 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" \
		 xmlns:html="http://www.w3.org/TR/REC-html40"> \
		 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"> \
		 </DocumentProperties> \
		 <OfficeDocumentSettings xmlns="urn:schemas-microsoft-com:office:office"> \
		  <AllowPNG/> \
		 </OfficeDocumentSettings> \
		 <ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel"> \
		  <ActiveSheet>0</ActiveSheet> \
		 </ExcelWorkbook> \
		 <Styles> \
		  <Style ss:ID="Default" ss:Name="Normal"> \
		   <Alignment ss:Vertical="Bottom"/> \
		   <Borders/> \
		   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="12" ss:Color="#000000"/> \
		   <Interior/> \
		   <NumberFormat/> \
		   <Protection/> \
		  </Style>';

	 	var s2 = ''; // for styles

		var s3 = ' </Styles>';

		var styles = {}; // hash based storage for styles
		var stylesn = 62; // First style

		// Generate style
		function hstyle(st) {
			// Prepare string
			var s = '';
			for(var key in st) {
				s += '<'+key;
				for(var attr in st[key]) {
					s += ' ';
					if(attr.substr(0,2) == 'x:') {
						s += attr;
					} else {
						s += 'ss:';
					}
					s += attr+'="'+st[key][attr]+'"';
				}
				s += '/>';
			}
			
			var hh = hash(s);
			// Store in hash
			if(styles[hh]) {
			} else {
				styles[hh] = {styleid:stylesn};
				s2 += '<Style ss:ID="s'+stylesn+'">';
				s2 += s;
				s2 += '</Style>';
				stylesn++;
			}
			return 's'+styles[hh].styleid;
		}

		for (var sheetid in sheets) {
			var sheet = sheets[sheetid];

			// If columns defined in sheet, then take them
			if(typeof sheet.columns != 'undefined') {
				columns = sheet.columns;
			} else {
				// Autogenerate columns if they are passed as parameters
				if(columns.length == 0 && data.length > 0) {
					if(typeof data[0] == 'object') {
						if(data[0] instanceof Array) {
							columns = data[0].map(function(d,columnidx){
								return {columnid:columnidx};
							});
						} else {
							columns = Object.keys(data[0]).map(function(columnid){
								return {columnid:columnid};
							});
						}
					}
				}
			};

			// Prepare columns
			columns.forEach(function(column,columnidx){
				if(typeof sheet.column != 'undefined') {
					extend(column,sheet.column);
				}

				if(typeof column.width == 'undefined') {
					if(sheet.column && (typeof sheet.column.width !='undefined')) {
						column.width = sheet.column.width;
					} else {
						column.width = 120;
					}
				}
				if(typeof column.width == 'number') column.width = column.width;
				if(typeof column.columnid == 'undefined') column.columnid = columnidx;
				if(typeof column.title == 'undefined') column.title = ""+column.columnid.trim();
				if(sheet.headers && sheet.headers instanceof Array) column.title = sheet.headers[idx];
			});


			// Header
	 		s3 +='<Worksheet ss:Name="'+sheetid+'"> \
	  			<Table ss:ExpandedColumnCount="'+columns.length
	  			+'" ss:ExpandedRowCount="'+((sheet.headers?1:0)+Math.min(data.length,sheet.limit||data.length))
	  				+'" x:FullColumns="1" \
	   			x:FullRows="1" ss:DefaultColumnWidth="65" ss:DefaultRowHeight="15">';

			columns.forEach(function (column,columnidx) {

	   			s3 += '<Column ss:Index="'+(columnidx+1)
	   			       +'" ss:AutoFitWidth="0" ss:Width="'+column.width+'"/>'
	   		});

	   		// Headers
			if(sheet.headers) {
	   			s3 += '<Row ss:AutoFitHeight="0">';

				// TODO: Skip columns to body

				// Headers
				columns.forEach(function (column,columnidx) {

		    		s3 += '<Cell ';

					if(typeof column.style != 'undefined') {
						var st = {};
						if(typeof column.style == 'function') {
							extend(st,column.style(sheet,column,columnidx));
						} else {
							extend(st,column.style);
						}
						s3 += 'ss:StyleID="'+hstyle(st)+'"';
					}

		    		s3 += '><Data ss:Type="String">';

					// Column title
					if(typeof column.title != 'undefined') {
						if(typeof column.title == 'function') {
							s3 += column.title(sheet,column,columnidx);
						} else {
							s3 += column.title;
						}
					}
					s3 += '</Data></Cell>';
				});	

				s3 += '</Row>';
			};


	   		// Data
			if(data && data.length > 0) {
				// Loop over data rows
				data.forEach(function(row,rowidx){
					// Limit number of rows on the sheet
					if(rowidx>sheet.limit) return;

					// Extend row properties
					var srow = {};
					extend(srow,sheet.row);
					if(sheet.rows && sheet.rows[rowidx]) {
						extend(srow,sheet.rows[rowidx]);
					}


		   			s3 += '<Row ';

					// Row style fromdefault sheet
					if(typeof srow != 'undefined') {
						var st = {};
						if(typeof srow.style != 'undefined') {
							if(typeof srow.style == 'function') {
								extend(st,srow.style(sheet,row,rowidx));
							} else {
								extend(st,srow.style);
							}
							s3 += 'ss:StyleID="'+hstyle(st)+'"';
						}
					};

					s3 += '>';//'ss:AutoFitHeight="0">'

					// Data
					columns.forEach(function (column,columnidx) {

						// Parameters
						var cell = {};
						extend(cell,sheet.cell);
						extend(cell,srow.cell);
						if(typeof sheet.column != 'undefined') {
							extend(cell,sheet.column.cell);
						}
						extend(cell,column.cell);
						if(sheet.cells && sheet.cells[rowidx] && sheet.cells[rowidx][columnidx]) {
							extend(cell,sheet.cells[rowidx][columnidx]);
						};

						// Create value
						var value = row[column.columnid];
						if(typeof cell.value == 'function') {
							value = cell.value(value,sheet,row,column,cell,rowidx,columnidx);
						}

						// Define cell type
						var typeid = cell.typeid;
						if(typeof typeid == 'function') {
							typeid = typeid(value,sheet,row,column,cell,rowidx,columnidx);
						}

						if(typeof typeid == 'undefined') {
							if(typeof value == 'number') typeid = 'number';
							else if(typeof value == 'string') typeid = 'string';
							else if(typeof value == 'boolean') typeid = 'boolean';
							else if(typeof value == 'object') {
								if(value instanceof Date) typeid = 'date';
							}
						};

						var Type = 'String';
						if(typeid == 'number') Type = 'Number';
						else if(typeid == 'date') Type = 'Date';
						// TODO: What else?


						// Prepare Data types styles
						var typestyle = '';

						if(typeid == 'money') {
							typestyle = 'mso-number-format:\"\\#\\,\\#\\#0\\\\ _р_\\.\";white-space:normal;';
						} else if(typeid == 'number') {
							typestyle = ' ';
						} else if (typeid == 'date') {
							typestyle = 'mso-number-format:\"Short Date\";'; 
						} else {
							// FOr other types is saved
							if( opts.types && opts.types[typeid] && opts.types[typeid].typestyle) {
								typestyle = opts.types[typeid].typestyle;
							} 
						}

						// TODO Replace with extend...
						typestyle = typestyle || 'mso-number-format:\"\\@\";'; // Default type style


			    		s3 += '<Cell ';
if(false) {
						s += "<td style='" + typestyle+"' " ;	
}			    		

						// Row style fromdefault sheet
						var st = {};
						if(typeof cell.style != 'undefined') {
							if(typeof cell.style == 'function') {
								extend(st,cell.style(value,sheet,row,column,rowidx,columnidx));
							} else {
								extend(st,cell.style);
							}
							s3 += 'ss:StyleID="'+hstyle(st)+'"';
						}

			    		s3 += '>';

			    		s3+='<Data ss:Type="'+Type+'">';

						// TODO Replace with extend...
						var format = cell.format;
						if(typeof value == 'undefined') {
							s3 += '';
						} else if(typeof format != 'undefined') {
							if(typeof format == 'function') {
								s3 += format(value);
							} else if(typeof format == 'string') {
								s3 += value; // TODO - add string format
							} else {
								throw new Error('Unknown format type. Should be function or string');
							}
						} else {
							if(typeid == 'number' || typeid == 'date') {
								s3 += value.toString();
							} else if(typeid == 'money') {
								s3 += (+value).toFixed(2);
							} else {
								s3 += value;
							}
						}

//			    		s3 += row[column.columnid];
			    		s3 += '</Data></Cell>';
			    	});
		   			
		   			s3 += '</Row>';
		   		});

		   	}
	   		// Finish
			s3 += '</Table></Worksheet>';
		};

		s3 +='</Workbook>';

		return s1+s2+s3;
	};

};

/** 
	Export to XLSX function
	@function
	@param {string|object} filename Filename or options
	@param {object|undefined} opts Options or undefined
	@param {array} data Data
	@param {array} columns Columns
	@parab {callback} cb Callback function
	@return {number} Number of files processed
*/

alasql.into.XLSX = function(filename, opts, data, columns, cb) {

	/** @type {number} result */
	var res = 1;

	if(deepEqual(columns,[{columnid:'_'}])) {
		data = data.map(function(dat){return dat._;});
		columns = undefined;
//		res = [{_:1}];
	} else {
//		data = data1;
	}

//console.log(data);

	/* If Node.js then require() else in browser take a global */
	if(typeof exports == 'object') {
		var XLSX = require('xlsx');
	} else {
		var XLSX = window.XLSX;
	};

	/* If called without filename, use opts */
	if(typeof filename == 'object') {
		opts = filename;
		filename = undefined;
	};


	/** @type {object} Workbook */
	var wb = {SheetNames:[], Sheets:{}};

	// Check overwrite flag
	if(opts.sourcefilename) {
		alasql.utils.loadBinaryFile(opts.sourcefilename,!!cb,function(data){
			wb = XLSX.read(data,{type:'binary'});
			doExport();
        });		
	} else {
		doExport();
	};

	/* Return result */
	if(cb) res = cb(res);
	return res;

	/**
		Export workbook
		@function 
	*/
	function doExport() {

		/* 
			If opts is array of arrays then this is a 
			multisheet workboook, else it is a singlesheet
		*/
		if(typeof opts == 'object' && opts instanceof Array) {
			if(data && data.length > 0) {
				data.forEach(function(dat,idx){
					prepareSheet(opts[idx],dat,undefined,idx+1)
				});
			}
		} else {
			prepareSheet(opts,data,columns,1);
		}

		saveWorkbook(cb);

	}


	/** 
		Prepare sheet
		@params {object} opts 
		@params {array} data 
		@params {array} columns Columns
	*/
	function prepareSheet(opts, data, columns, idx) {

		/** Default options for sheet */
		var opt = {sheetid:'Sheet '+idx,headers:true};
		alasql.utils.extend(opt, opts);

		// Generate columns if they are not defined
		if((!columns || columns.length == 0) && data.length > 0) {
			columns = Object.keys(data[0]).map(function(columnid){return {columnid:columnid}});
		}

		var cells = {};

		if(wb.SheetNames.indexOf(opt.sheetid) > -1) {
			cells = wb.Sheets[opt.sheetid];
		} else {
			wb.SheetNames.push(opt.sheetid);
			wb.Sheets[opt.sheetid] = {};
			cells = wb.Sheets[opt.sheetid];			
		}

		var range = "A1";
		if(opt.range) range = opt.range;

		var col0 = alasql.utils.xlscn(range.match(/[A-Z]+/)[0]);
		var row0 = +range.match(/[0-9]+/)[0]-1;

		if(wb.Sheets[opt.sheetid]['!ref']) {
			var rangem = wb.Sheets[opt.sheetid]['!ref'];
			var colm = alasql.utils.xlscn(rangem.match(/[A-Z]+/)[0]);
			var rowm = +rangem.match(/[0-9]+/)[0]-1;
		} else {
			var colm = 1, rowm = 1;
		}
		var colmax = Math.max(col0+columns.length,colm);
		var rowmax = Math.max(row0+data.length+2,rowm);

//		console.log(col0,row0);
		var i = row0+1;

		wb.Sheets[opt.sheetid]['!ref'] = 'A1:'+alasql.utils.xlsnc(colmax)+(rowmax);
//		var i = 1;

		if(opt.headers) {
			columns.forEach(function(col, idx){
				cells[alasql.utils.xlsnc(col0+idx)+""+i] = {v:col.columnid.trim()};
			});
			i++;
		}

		for(var j=0;j<data.length;j++) {
			columns.forEach(function(col, idx){
				var cell = {v:data[j][col.columnid]};
				if(typeof data[j][col.columnid] == 'number') {
					cell.t = 'n';
				} else if(typeof data[j][col.columnid] == 'string') {
					cell.t = 's';
				} else if(typeof data[j][col.columnid] == 'boolean') {				
					cell.t = 'b';
				} else if(typeof data[j][col.columnid] == 'object') {
					if(data[j][col.columnid] instanceof Date) {
						cell.t = 'd';
					}
				}
				cells[alasql.utils.xlsnc(col0+idx)+""+i] = cell;
			});		
			i++;
		}

	}

	/** 
		Save Workbook
		@params {array} wb Workbook 
		@params {callback} cb Callback
	*/
	function saveWorkbook(cb) {

//console.log(wb);

		if(typeof filename == 'undefined') {
			res = wb;
		} else {
			if(typeof exports == 'object') {
				/* For Node.js */
				XLSX.writeFile(wb, filename);
			} else {
				/* For browser */
				var wopts = { bookType:'xlsx', bookSST:false, type:'binary' };
				var wbout = XLSX.write(wb,wopts);

				function s2ab(s) {
				  var buf = new ArrayBuffer(s.length);
				  var view = new Uint8Array(buf);
				  for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
				  return buf;
				}

				/* the saveAs call downloads a file on the local machine */
		//		saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), '"'+filename+'"')
		//		saveAs(new Blob([s2ab(wbout)],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}), filename)
		//		saveAs(new Blob([s2ab(wbout)],{type:"application/vnd.ms-excel"}), '"'+filename+'"');
				if(isIE() == 9) {
					throw new Error('Cannot save XLSX files in IE9. Please use XLS() export function');
//					var URI = 'data:text/plain;charset=utf-8,';

		/** @todo Check if this code is required */

/*
					var testlink = window.open("about:blank", "_blank");
					var s = '';
					for(var i=0,ilen=wbout.length;i<ilen;i++) {
						var ch = wbout.charCodeAt(i);
						if(i<20) console.log('&#'+ch+';');
						s += '&#x'+ch.toString(16)+';';
					};
					testlink.document.write(s); //fileData has contents for the file
					testlink.document.close();
					testlink.document.execCommand('SaveAs', false, filename);
					testlink.close();         		
*/
//					alert('ie9');
				} else {
					saveAs(new Blob([s2ab(wbout)],{type:"application/octet-stream"}), filename);
				}
			}

		}

		// data.forEach(function(d){
		// 	s += columns.map(function(col){
		// 		return d[col.columnid];
		// 	}).join(opts.separator)+'\n';	
		// });
		// alasql.utils.saveFile(filename,s);

	};
};
/*
//
// FROM functions Alasql.js
// Date: 11.12.2014
// (c) 2014, Andrey Gershun
//
*/

/**
   Meteor
*/

alasql.from.METEOR = function(filename, opts, cb, idx, query) {
	var res = filename.find(opts).fetch();
	if(cb){
		res = cb(res, idx, query);
	}
	return res;
 };

/**
	Google Spreadsheet reader
 */
alasql.from.TABLETOP = function(key, opts, cb, idx, query) {
	var res = [];

	var opt = {headers:true, simpleSheet:true, key:key};
	alasql.utils.extend(opt, opts);
	opt.callback = function(data){
		res = data;
		if(cb){
			res = cb(res, idx, query);
		}
	};

	Tabletop.init(opt);
	return res;
};


alasql.from.HTML = function(selector, opts, cb, idx, query) {
	var opt = {};
	alasql.utils.extend(opt, opts);

	var sel = document.querySelector(selector);
	if(!sel && sel.tagName !== "TABLE") {
		throw new Error('Selected HTML element is not a TABLE');
	}

	var res = [];
	var headers = opt.headers;

	if(headers && !(headers instanceof Array)) {
		headers = [];
		var ths = sel.querySelector("thead tr").children;
		for(var i=0;i<ths.length;i++){
			if(!(ths.item(i).style && ths.item(i).style.display === "none" && opt.skipdisplaynone)) {
				headers.push(ths.item(i).textContent);
			} else {
				headers.push(undefined);
			}
		}
	}
//	console.log(headers);

	var trs = sel.querySelectorAll("tbody tr");

	for(var j=0;j<trs.length;j++) {
		var tds = trs.item(j).children;
		var r = {};
		for(var i=0;i<tds.length;i++){
			if(!(tds.item(i).style && tds.item(i).style.display === "none" && opt.skipdisplaynone)) {
				if(headers) {
					r[headers[i]] = tds.item(i).textContent;
				} else {
					r[i] = tds.item(i).textContent;
	//				console.log(r);
				}
			}
		}
		res.push(r);
	}
//console.log(res);
	if(cb){
		res = cb(res, idx, query);
	}
	return res;
}


alasql.from.RANGE = function(start, finish, cb, idx, query) {
	var res = [];
	for(var i=start;i<=finish;i++){
		res.push(i);
	}
//	res = new alasql.Recordset({data:res,columns:{columnid:'_'}});	
	if(cb){
		res = cb(res, idx, query);
	}
	return res;
}

// Read data from any file
alasql.from.FILE = function(filename, opts, cb, idx, query) {
	var fname;
	if(typeof filename === 'string') {
		fname = filename;

	} else if(filename instanceof Event) {
		fname = filename.target.files[0].name;

	} else {
		throw new Error("Wrong usage of FILE() function");
	}

	var parts = fname.split('.');
//	console.log("parts",parts,parts[parts.length-1]);
	var ext = parts[parts.length-1].toUpperCase();
//	console.log("ext",ext);
	if(alasql.from[ext]) {
//		console.log(ext);
		return alasql.from[ext](filename, opts, cb, idx, query);
	} else {
		throw new Error('Cannot recognize file type for loading');
	}
};


// Read JSON file

alasql.from.JSON = function(filename, opts, cb, idx, query) {
	var res;
	//console.log('cb',cb);
//console.log('JSON');
	alasql.utils.loadFile(filename,!!cb,function(data){
//		console.log('DATA:'+data);
//		res = [{a:1}];
		res = JSON.parse(data);	
		if(cb){
			res = cb(res, idx, query);
		}
	});
	return res;
};

alasql.from.TXT = function(filename, opts, cb, idx, query) {
	var res;
	alasql.utils.loadFile(filename,!!cb,function(data){
		res = data.split(/\r?\n/);
		for(var i=0, ilen=res.length; i<ilen;i++) {
			// Please avoid '===' here
			if(res[i] == +res[i]){	// jshint ignore:line
				res[i] = +res[i];
			}
			res[i] = [res[i]];
		}
		if(cb){
			res = cb(res, idx, query);
		}
	});
	return res;
};

alasql.from.TAB = alasql.from.TSV = function(filename, opts, cb, idx, query) {
	opts = opts || {};
	opts.separator = '\t';
	return alasql.from.CSV(filename, opts, cb, idx, query);
};

alasql.from.CSV = function(filename, opts, cb, idx, query) {
	var opt = {
		separator: ',',
		quote: '"'
	};
	alasql.utils.extend(opt, opts);
	var res, hs;
	alasql.utils.loadFile(filename,!!cb,function(text){

		var delimiterCode = opt.separator.charCodeAt(0);
		var quoteCode = opt.quote.charCodeAt(0);

      	var EOL = {}, EOF = {}, rows = [], N = text.length, I = 0, n = 0, t, eol;
			function token() {
			if (I >= N){
				return EOF;
			}
			if (eol){
				return eol = false, EOL;
			}
			var j = I;
			if (text.charCodeAt(j) === quoteCode) {
				var i = j;
				while (i++ < N) {
					if (text.charCodeAt(i) === quoteCode) {
						if (text.charCodeAt(i + 1) !== quoteCode){
							break;
						}
						++i;
					}
				}
				I = i + 2;
				var c = text.charCodeAt(i + 1);
				if (c === 13) {
					eol = true;
					if (text.charCodeAt(i + 2) === 10){
						++I;
					}
				} else if (c === 10) {
					eol = true;
				}
				return text.substring(j + 1, i).replace(/""/g, '"');
			}
			while (I < N) {
				var c = text.charCodeAt(I++), k = 1;
				if(c === 10){
					eol = true;
				} else if (c === 13) {
					eol = true;
					if (text.charCodeAt(I) === 10){
						++I;
						++k;
					}
				} else if(c !== delimiterCode){
					continue;
				}
				return text.substring(j, I - k);
			}
			return text.substring(j);
		}

		while ((t = token()) !== EOF) {
		var a = [];
		while (t !== EOL && t !== EOF) {
		a.push(t);
		t = token();
		}

        if(opt.headers) {
        	if(n === 0) {
				if(typeof opt.headers === 'boolean') {
	        		hs = a;
				} else if(opt.headers instanceof Array) {
					hs = opt.headers;
	        		var r = {};
	        		hs.forEach(function(h,idx){
	        			r[h] = a[idx];
	        			// Please avoid === here 
						if((typeof r[h] !== 'undefined') && (r[h]).trim() == +r[h]){ // jshint ignore:line
							r[h] = +r[h];
						}
	        		});
					rows.push(r);
				}

        	} else {
        		var r = {};
        		hs.forEach(function(h,idx){
        			r[h] = a[idx];
					if((typeof r[h] !== 'undefined') && r[h].trim() == +r[h]){ // jshint ignore:line
						r[h] = +r[h];
					}
        		});
        		rows.push(r);
        	}
        	n++;
        } else {
    	    rows.push(a);
    	}
      }

      res = rows;

	if(opt.headers) {
		if(query && query.sources && query.sources[idx]) {
			var columns = query.sources[idx].columns = [];
			hs.forEach(function(h){
				columns.push({columnid:h});
			});
		}
	}

/*
if(false) {
		res = data.split(/\r?\n/);
		if(opt.headers) {
			if(query && query.sources && query.sources[idx]) {
				var hh = [];
				if(typeof opt.headers == 'boolean') {
					hh = res.shift().split(opt.separator);
				} else if(opt.headers instanceof Array) {
					hh = opt.headers;
				}
				var columns = query.sources[idx].columns = [];
				hh.forEach(function(h){
					columns.push({columnid:h});
				});
				for(var i=0, ilen=res.length; i<ilen;i++) {
					var a = res[i].split(opt.separator);
					var b = {};
					hh.forEach(function(h,j){
						b[h] = a[j];
					});
					res[i] = b;
				}
//				console.log(res[0]);
			}	
		} else {
			for(var i=0, ilen=res.length; i<ilen;i++) {
				res[i] = res[i].split(opt.separator);
			}
		}

};
*/
		if(cb){
			res = cb(res, idx, query);
		}
	});
	return res;
};



function XLSXLSX(X,filename, opts, cb, idx, query) {
	var opt = {};
	opts = opts || {};
	alasql.utils.extend(opt, opts);
	var res;

	alasql.utils.loadBinaryFile(filename,!!cb,function(data){

//	function processData(data) {
		var workbook = X.read(data,{type:'binary'});
//		console.log(workbook);
		var sheetid;
		if(typeof opt.sheetid === 'undefined') {
			sheetid = workbook.SheetNames[0];
		} else {
			sheetid = opt.sheetid;
		}
		var range;
		if(typeof opt.range === 'undefined') {
			range = workbook.Sheets[sheetid]['!ref'];
		} else {
			range = opt.range;
			if(workbook.Sheets[sheetid][range]){
				range = workbook.Sheets[sheetid][range];
			}
		}
		var rg = range.split(':');
		var col0 = rg[0].match(/[A-Z]+/)[0];
		var row0 = +rg[0].match(/[0-9]+/)[0];
		var col1 = rg[1].match(/[A-Z]+/)[0];
		var row1 = +rg[1].match(/[0-9]+/)[0];
//		console.log(114,rg,col0,col1,row0,row1);
//		console.log(114,rg,alasql.utils.xlscn(col0),alasql.utils.xlscn(col1));

		var hh = {};
		for(var j=alasql.utils.xlscn(col0);j<=alasql.utils.xlscn(col1);j++){
			var col = alasql.utils.xlsnc(j);
			if(opt.headers) {
				if(workbook.Sheets[sheetid][col+""+row0]) {
					hh[col] = workbook.Sheets[sheetid][col+""+row0].v;
				} else {
					hh[col] = col;
				}
			} else {
				hh[col] = col;
			}
		}
		var res = [];
		if(opt.headers){
			row0++;
		}
		for(var i=row0;i<=row1;i++) {
			var row = {};
			for(var j=alasql.utils.xlscn(col0);j<=alasql.utils.xlscn(col1);j++){
				var col = alasql.utils.xlsnc(j);
				if(workbook.Sheets[sheetid][col+""+i]) {
					row[hh[col]] = workbook.Sheets[sheetid][col+""+i].v;
				}
			}
			res.push(row);
		}

		if(cb){
			res = cb(res, idx, query);
		}
	}, function(err){
		throw err;
	});

	return res;
}


alasql.from.XLS = function(filename, opts, cb, idx, query) {
	var X;
	if(typeof exports === 'object') {
		X = require('xlsjs');
	} else {
		X = window.XLS;
		if(!X) {
			throw new Error('XLS library is not attached');
		}
	}
	return XLSXLSX(X,filename, opts, cb, idx, query);
}

alasql.from.XLSX = function(filename, opts, cb, idx, query) {
	var X;
	if(typeof exports === 'object') {
		X = require('xlsx');
	} else {
		X = window.XLSX;
		if(!X) {
			throw new Error('XLSX library is not attached');
		}
	}
	return XLSXLSX(X,filename, opts, cb, idx, query);
};




alasql.from.XML = function(filename, opts, cb, idx, query) {
  var res;
  //console.log('cb',cb);
//console.log('JSON');
  alasql.utils.loadFile(filename,!!cb,function(data){
//    console.log('DATA:'+data);
//    res = [{a:1}];

    res = xmlparse(data).root; 
//    console.log(res);
    if(cb) res = cb(res, idx, query);
  });
  return res;
};

/**
 * Parse the given string of `xml`.
 *
 * @param {String} xml
 * @return {Object}
 * @api public
 */

function xmlparse(xml) {
  xml = xml.trim();

  // strip comments
  xml = xml.replace(/<!--[\s\S]*?-->/g, '');

  return document();

  /**
   * XML document.
   */

  function document() {
    return {
      declaration: declaration(),
      root: tag()
    }
  }

  /**
   * Declaration.
   */

  function declaration() {
    var m = match(/^<\?xml\s*/);
    if (!m) return;

    // tag
    var node = {
      attributes: {}
    };

    // attributes
    while (!(eos() || is('?>'))) {
      var attr = attribute();
      if (!attr) return node;
      node.attributes[attr.name] = attr.value;
    }

    match(/\?>\s*/);

    return node;
  }

  /**
   * Tag.
   */

  function tag() {
    var m = match(/^<([\w-:.]+)\s*/);
    if (!m) return;

    // name
    var node = {
      name: m[1],
      attributes: {},
      children: []
    };

    // attributes
    while (!(eos() || is('>') || is('?>') || is('/>'))) {
      var attr = attribute();
      if (!attr) return node;
      node.attributes[attr.name] = attr.value;
    }

    // self closing tag
    if (match(/^\s*\/>\s*/)) {
      return node;
    }

    match(/\??>\s*/);

    // content
    node.content = content();

    // children
    var child;
    while (child = tag()) {
      node.children.push(child);
    }

    // closing
    match(/^<\/[\w-:.]+>\s*/);

    return node;
  }

  /**
   * Text content.
   */

  function content() {
    var m = match(/^([^<]*)/);
    if (m) return m[1];
    return '';
  }

  /**
   * Attribute.
   */

  function attribute() {
    var m = match(/([\w:-]+)\s*=\s*("[^"]*"|'[^']*'|\w+)\s*/);
    if (!m) return;
    return { name: m[1], value: strip(m[2]) }
  }

  /**
   * Strip quotes from `val`.
   */

  function strip(val) {
    return val.replace(/^['"]|['"]$/g, '');
  }

  /**
   * Match `re` and advance the string.
   */

  function match(re) {
    var m = xml.match(re);
    if (!m) return;
    xml = xml.slice(m[0].length);
    return m;
  }

  /**
   * End-of-source.
   */

  function eos() {
    return 0 == xml.length;
  }

  /**
   * Check for `prefix`.
   */

  function is(prefix) {
    return 0 == xml.indexOf(prefix);
  }
};

alasql.from.GEXF = function(filename, opts, cb, idx, query) {

	var res;
	alasql('SEARCH FROM XML('+filename+')',[],function(data){
		res = data;
		console.log(res);
		if(cb) res=cb(res);
	});
  return res;
};

/*
//
// HELP for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

yy.Help = function (params) { return yy.extend(this, params); }
yy.Help.prototype.toString = function() {
	var s = 'HELP';
	if(this.subject) s += ' '+this.subject;
	return s;
}

// Help string
helpdocs = [
	{command:'ALTER TABLE table RENAME TO table'},
	{command:'ALTER TABLE table ADD COLUMN column coldef'},
	{command:'ALTER TABLE table MODIFY COLUMN column coldef'},
	{command:'ALTER TABLE table RENAME COLUMN column TO column'},
	{command:'ALTER TABLE table DROP column'},
	{command:'ATTACH engine DATABASE database'},
	{command:'ASSERT value'},
	{command:'BEGIN [TRANSACTION]'},
	{command:'COMMIT [TRANSACTION]'},
	{command:'CREATE [engine] DATABASE [IF NOT EXISTS] database'},
	{command:'CREATE TABLE [IF NOT EXISTS] table (column definitions)'},
	{command:'DELETE FROM table [WHERE expression]'},
	{command:'DETACH DATABASE database'},
	{command:'DROP [engine] DATABASE [IF EXISTS] database'},
	{command:'DROP TABLE [IF EXISTS] table'},
	{command:'INSERT INTO table VALUES value,...'},
	{command:'INSERT INTO table DEFAULT VALUES'},
	{command:'INSERT INTO table SELECT select'},
	{command:'HELP [subject]'},
	{command:'ROLLBACK [TRANSACTION]'},
	{command:'SELECT [modificator] columns [INTO table] [FROM table,...] [[mode] JOIN [ON] [USING]] [WHERE ] [GROUP BY] [HAVING] [ORDER BY] '},
	{command:'SET option value'},
	{command:'SHOW [engine] DATABASES'},
	{command:'SHOW TABLES'},
	{command:'SHOW CREATE TABLE table'},
	{command:'UPDATE table SET column1 = expression1, ... [WHERE expression]'},
	{command:'USE [DATABASE] database'},
	{command:'expression'},
	{command:'See also <a href="http://github/agershun/alasq">http://github/agershun/alasq</a> for more information'}
];

// execute
yy.Help.prototype.execute = function (databaseid, params, cb) {
	var ss = [];
	if(!this.subject) {
		ss = helpdocs;
	} else {
		ss.push('See also <a href="http://github/agershun/alasq">http://github/agershun/alasq</a> for more information');
	}
	if(cb) ss = cb(ss);
	return ss;
};

/*
//
// HELP for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

/**
	Print statement 
	@class
	@param {object} params Initial setup properties
*/

yy.Print = function (params) { return yy.extend(this, params); }

/** 
	Generate SQL string 
	@this Print statement object
*/
yy.Print.prototype.toString = function() {
	var s = 'PRINT';
	if(this.statement) s += ' '+this.statement.toString();
	return s;
}


/**
 	Print result of select statement or expression
 	@param {string} databaseid Database identificator
 	@param {object} params Query parameters
 	@param {statement-callback} cb Callback function 
	@this Print statement object
*/
yy.Print.prototype.execute = function (databaseid,params,cb) {
//	console.log(this.url);
	var self = this;
	var res = 1;
//console.log(this);
	alasql.precompile(this,databaseid,params);  /** @todo Change from alasql to this */

	if(this.exprs && this.exprs.length >0) {
		var rs = this.exprs.map(function(expr){

//			console.log('var y;return '+expr.toJS('({})','', null));
			var exprfn =  new Function("params,alasql,p",'var y;return '+expr.toJS('({})','', null)).bind(self);
			var r = exprfn(params,alasql);
			return JSONtoString(r);
		});
		console.log.apply(console,rs);
	} else if(this.select) {
		var r = this.select.execute(databaseid,params);
		console.log(JSONtoString(r));
	} else {
		console.log();
	}

	if(cb) res = cb(res);
	return res;
};

/*
//
// HELP for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

yy.Source = function (params) { return yy.extend(this, params); }
yy.Source.prototype.toString = function() {
	var s = 'SOURCE';
	if(this.url) s += " '"+this.url+" '";
	return s;
}

// SOURCE FILE
yy.Source.prototype.execute = function (databaseid,params,cb) {
//	console.log(this.url);
	var res;
	loadFile(this.url, !!cb, function(data){
//		console.log(data);
//		res = 1;
		res = alasql(data);
		if(cb) res = cb(res);
		return res;
	}, function(err){
		throw err;
	});
	return res;
};

/*
//
// HELP for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

yy.Require = function (params) { return yy.extend(this, params); }
yy.Require.prototype.toString = function() {
	var s = 'REQUIRE';
	if(this.paths && this.paths.length > 0) {
		s += this.paths.map(function(path){
			return path.toString()
		}).join(',');
	}
	if(this.plugins && this.plugins.length > 0) {
		s += this.plugins.map(function(plugin){
			return plugin.toUpperCase();
		}).join(',');
	}
	return s;
}

/**
 Attach plug-in for Alasql
 */
yy.Require.prototype.execute = function (databaseid,params,cb) {
	var self = this;
	var res = 0;
	var ss = '';
//	console.log(this.paths);
	if(this.paths && this.paths.length > 0) {
		this.paths.forEach(function(path){
			loadFile(path.value, !!cb, function(data){
				res++;
//				console.log(res,self.paths.length);
//				console.log(data);
				ss += data;
				if(res<self.paths.length) return;

//				console.log(ss);
				new Function("params,alasql",ss)(params,alasql);
				if(cb) res = cb(res);
			});
		});
	} else if(this.plugins && this.plugins.length > 0) {

		this.plugins.forEach(function(plugin){
			// If plugin is not loaded already
			if(!alasql.plugins[plugin]) {
				loadFile(alasql.path+'/alasql-'+plugin.toLowerCase()+'.js', !!cb, function(data){
					// Execute all plugins at the same time
					res++;
					ss += data;
					if(res<self.plugins.length) return;

					new Function("params,alasql",ss)(params,alasql);
					alasql.plugins[plugin] = true; // Plugin is loaded
					if(cb) res = cb(res);
				});
			}
		});
	} else {
		if(cb) res = cb(res);			
	} 
	return res;
};

/*
//
// HELP for Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

yy.Assert = function (params) { return yy.extend(this, params); }
yy.Source.prototype.toString = function() {
	var s = 'ASSERT';
	if(this.value) s += ' '+JSON.stringify(this.value);
	return s;
}

// SOURCE FILE
yy.Assert.prototype.execute = function (databaseid) {
//	console.log(alasql.res, this.value);
	if(!deepEqual(alasql.res,this.value)) {
//		if(this.message) {
//			throw this.
//		} else {
			throw new Error((this.message||'Assert wrong')+': '+JSON.stringify(alasql.res)+' == '+JSON.stringify(this.value));
//		}
	}
	return 1;
};

//
// 91websql.js
// WebSQL database support
// (c) 2014, Andrey Gershun
//

var WEBSQL = alasql.engines.WEBSQL = function (){};

WEBSQL.createDatabase = function(wdbid, args, dbid, cb){
	var res = 1;
	var wdb = openDatabase(wdbid, args[0], args[1], args[2]);
	if(this.dbid) {
		var db = alasql.createDatabase(this.dbid);
		db.engineid = 'WEBSQL';
		db.wdbid = wdbid;
		sb.wdb = db;
	}
	if(!wdb) {
		throw new Error('Cannot create WebSQL database "'+databaseid+'"')
	}
	if(cb) cb(res);
	return res;
};

WEBSQL.dropDatabase = function(databaseid){
	throw new Error('This is impossible to drop WebSQL database.');
};

WEBSQL.attachDatabase = function(databaseid, dbid, args, params, cb){
	var res = 1;
	if(alasql.databases[dbid]) {
		throw new Error('Unable to attach database as "'+dbid+'" because it already exists');
	};
	alasqlopenDatabase(databaseid, args[0], args[1], args[2]);
	return res;
}



//
// 91indexeddb.js
// AlaSQL IndexedDB module
// Date: 18.04.2015
// (c) Andrey Gershun
//


 if(typeof(window) != 'undefined' && window.indexedDB) {

var IDB = alasql.engines.INDEXEDDB = function (){};

// For Chrome it work normally, for Firefox - simple shim
if(typeof window.indexedDB.webkitGetDatabaseNames == 'function') {
	IDB.getDatabaseNames = window.indexedDB.webkitGetDatabaseNames.bind(window.indexedDB);
} else {
	IDB.getDatabaseNames = function () {
		var request = {};
		var result = {
			contains:function(name){
				return true; // Always return true
			},
			notsupported: true
		};
		setTimeout(function(){
			var event = {target:{result:result}}
			request.onsuccess(event);
		},0);
		return request;
	};
	IDB.getDatabaseNamesNotSupported = true;
}

//
// SHOW DATABASES
// work only in chrome
//
IDB.showDatabases = function(like,cb) {
	// console.log('showDatabases',arguments);
	var request = IDB.getDatabaseNames();
	request.onsuccess = function(event) {
		var dblist = event.target.result;
		if(IDB.getDatabaseNamesNotSupported) {
			throw new Error('SHOW DATABASE is not supported in this browser');
		}
		var res = [];
		if(like) {
			var relike = new RegExp((like.value).replace(/\%/g,'.*'),'g');
		}
		for(var i=0;i<dblist.length;i++) {
			if(!like || dblist[i].match(relike)) {
				res.push({databaseid: dblist[i]});
			}
		};
		cb(res);
	};
};

IDB.createDatabase = function(ixdbid, args, ifnotexists, dbid, cb){
console.log(arguments);
	if(ifnotexists) {
		var request2 = window.indexedDB.open(ixdbid,1);
		request2.onsuccess = function(event) {
			event.target.result.close();
			cb(1);
		};
	} else {
		var request1 = window.indexedDB.open(ixdbid,1);
		request1.onupgradeneeded = function (e){
			console.log('abort');
		    e.target.transaction.abort();
		};
		request1.onsuccess = function(e) {
			console.log('success');
			if(ifnotexists) {
				cb(0);
			} else {
				throw new Error('IndexedDB: Cannot create new database "'+ixdbid+'" because it already exists');				
			}
		}
	}

/*	var request1 = IDB.getDatabaseNames();
	request1.onsuccess = function(event) {
		var dblist = event.target.result;
		if(dblist.contains(ixdbid)){
			if(ifnotexists) {
				cb(0);
				return;
			} else {		
				throw new Error('IndexedDB: Cannot create new database "'+ixdbid+'" because it already exists');
			}
		};
*/
/*	};
*/	// }
};

IDB.createDatabase = function(ixdbid, args, ifnotexists, dbid, cb){
	if(IDB.getDatabaseNamesNotSupported) {
		// Hack for Firefox
		if(ifnotexists) {
//			console.log('ifnotexists');
			var dbExists = true;
			var request2 = window.indexedDB.open(ixdbid);
//			console.log(1);
			request2.onupgradeneeded = function (e){
//				console.log('abort');
				dbExists = false;
//			    e.target.transaction.abort();
//			    cb(0);				
			};
			request2.onsuccess = function(event) {
//				console.log('success');
//console.log(event.target.result);
				event.target.result.close();
				if(dbExists) {
					cb(0);
				} else {
					cb(1);
				}
			};
		} else {
//			console.log('without');
			var request1 = window.indexedDB.open(ixdbid);
			request1.onupgradeneeded = function (e){
			    e.target.transaction.abort();
			};
			request1.onabort = function(event) {
				cb(1);
			};
			request1.onsuccess = function(event) {
				event.target.result.close();
				throw new Error('IndexedDB: Cannot create new database "'+ixdbid+'" because it already exists');
//				cb(0);
			};

		}

	} else {
		var request1 = IDB.getDatabaseNames();
		request1.onsuccess = function(event) {
			var dblist = event.target.result;
			if(dblist.contains(ixdbid)){
				if(ifnotexists) {
					cb(0);
					return;
				} else {		
					throw new Error('IndexedDB: Cannot create new database "'+ixdbid+'" because it already exists');
				}
			};

			var request2 = window.indexedDB.open(ixdbid,1);
			request2.onsuccess = function(event) {
				event.target.result.close();
				cb(1);
			};
		};		
	}
	// }
};


IDB.dropDatabase = function(ixdbid, ifexists, cb){
	var request1 = IDB.getDatabaseNames();
	request1.onsuccess = function(event) {
		var dblist = event.target.result;
		if(!dblist.contains(ixdbid)){
			if(ifexists) {
				cb(0);
				return;
			} else {
				throw new Error('IndexedDB: Cannot drop new database "'+ixdbid+'" because it does not exist');
			}
		};
		var request2 = window.indexedDB.deleteDatabase(ixdbid);
		request2.onsuccess = function(event) {
//			console.log('dropped');
			if(cb) cb(1);
		}
	};
};

IDB.attachDatabase = function(ixdbid, dbid, args, params, cb) {
	var request1 = IDB.getDatabaseNames();
		request1.onsuccess = function(event) {
		var dblist = event.target.result;
		if(!dblist.contains(ixdbid)){
			throw new Error('IndexedDB: Cannot attach database "'+ixdbid+'" because it does not exist');
		};
		var request2 = window.indexedDB.open(ixdbid);
		request2.onsuccess = function(event) {
			var ixdb = event.target.result;
			var db = new alasql.Database(dbid || ixdbid);
			db.engineid = "INDEXEDDB";
			db.ixdbid = ixdbid;
			db.tables = [];
		  	var tblist = ixdb.objectStoreNames;
			for(var i=0;i<tblist.length;i++){
				db.tables[tblist[i]] = {};
			};

		// if(!alasql.options.autocommit) {
		// if(db.tables){
		// 	for(var tbid in db.tables) {
		// 		db.tables[tbid].data = LS.get(db.lsdbid+'.'+tbid);
		// 	}
		// 	}
		// }
			event.target.result.close();		
			cb(1);
		};
	};
};




IDB.createTable = function(databaseid, tableid, ifnotexists, cb) {
//	console.log(arguments);
	var ixdbid = alasql.databases[databaseid].ixdbid;
//	console.log(ixdbid);
	var request1 = IDB.getDatabaseNames();
		request1.onsuccess = function(event) {
		var dblist = event.target.result;
		if(!dblist.contains(ixdbid)){
			throw new Error('IndexedDB: Cannot create table in database "'+ixdbid+'" because it does not exist');
		};
		var request2 = window.indexedDB.open(ixdbid);
		request2.onversionchange = function(event) {
//			console.log('onversionchange');
			event.target.result.close();
		};
		request2.onsuccess = function(event) {
			var version = event.target.result.version;
			event.target.result.close();

			var request3 = window.indexedDB.open(ixdbid, version+1);
			request3.onupgradeneeded = function(event) {
				var ixdb = event.target.result;
//				console.log(ixdb);
				var store = ixdb.createObjectStore(tableid, {autoIncrement:true});
//				console.log(store);
			};
			request3.onsuccess = function(event) {
//				console.log('opened');
				event.target.result.close();
				cb(1);
			};
			request3.onerror = function(event){
				throw event;
//				console.log('error');
			}
			request3.onblocked = function(event){
				throw new Error('Cannot create table "'+tableid+'" because database "'+databaseid+'"  is blocked');
//				console.log('blocked');
			}				
		};
	};
};

IDB.dropTable = function (databaseid, tableid, ifexists, cb) {
	var ixdbid = alasql.databases[databaseid].ixdbid;

	var request1 = IDB.getDatabaseNames();
		request1.onsuccess = function(event) {
		var dblist = event.target.result;
	
		if(!dblist.contains(ixdbid)){
			throw new Error('IndexedDB: Cannot drop table in database "'+ixdbid+'" because it does not exist');
		};
		var request2 = window.indexedDB.open(ixdbid);
		request2.onversionchange = function(event) {
			event.target.result.close();
		};
		request2.onsuccess = function(event) {
			var version = event.target.result.version;
			event.target.result.close();

			var request3 = window.indexedDB.open(ixdbid, version+1);
			request3.onupgradeneeded = function(event) {
				var ixdb = event.target.result;
				if(ixdb.objectStoreNames.contains(tableid)) {
					ixdb.deleteObjectStore(tableid);
					delete alasql.databases[databaseid].tables[tableid];
				} else {
					if(!ifexists) {
						throw new Error('IndexedDB: Cannot drop table "'+tableid+'" because it is not exist');
					}
				}
//				var store = ixdb.createObjectStore(tableid);
				// console.log('deleted');
			};
			request3.onsuccess = function(event) {
				// console.log('opened');
				event.target.result.close();
				cb(1);
			};
			request3.onerror = function(event){
				throw event;
//				console.log('error');
			}
			request3.onblocked = function(event){
				throw new Error('Cannot drop table "'+tableid+'" because database "'+databaseid+'" is blocked');
//				console.log('blocked');
			}				
		};
	};
}

// IDB.intoTable = function(databaseid, tableid, value, cb) {
// //	console.log('intoTable',databaseid, tableid, value, cb);
// 	var ixdbid = alasql.databases[databaseid].ixdbid;
// 	var request1 = indexedDB.open(ixdbid);
// 	request1.onsuccess = function(event) {
// 		var ixdb = event.target.result;
// 		var tx = ixdb.transaction([tableid],"readwrite");
// 		var tb = tx.objectStore(tableid);
// 		// console.log(tb.keyPath);
// 		// console.log(tb.indexNames);
// 		// console.log(tb.autoIncrement);
// 		for(var i=0, ilen = value.length;i<ilen;i++) {
// 			tb.add(value[i]);
// 		};
// 		tx.oncomplete = function() {
// 			ixdb.close();
// //			console.log('indexeddb',203,ilen);
// 			cb(ilen);
// 		}
// 	};

// 	// var tb = LS.get(lsdbid+'.'+tableid);
// 	// if(!tb) tb = [];
// 	// tb = tb.concat(value);
// 	// LS.set(lsdbid+'.'+tableid, tb);
// //	console.log(lsdbid+'.'+tableid, tb);
// //	console.log(localStorage[lsdbid+'.'+tableid]);
// 	// if(cb) cb(res);
// 	// return res;
// };

IDB.intoTable = function(databaseid, tableid, value, columns, cb) {
	// console.log(arguments);
	// console.trace();
//	console.log('intoTable',databaseid, tableid, value, cb);
	var ixdbid = alasql.databases[databaseid].ixdbid;
	var request1 = window.indexedDB.open(ixdbid);
	request1.onsuccess = function(event) {
		var ixdb = event.target.result;
		var tx = ixdb.transaction([tableid],"readwrite");
		var tb = tx.objectStore(tableid);
		// console.log(tb.keyPath);
		// console.log(tb.indexNames);
		// console.log(tb.autoIncrement);
		for(var i=0, ilen = value.length;i<ilen;i++) {
			tb.add(value[i]);
		};
		tx.oncomplete = function() {
			ixdb.close();
//			console.log('indexeddb',203,ilen);
			cb(ilen);
		}
	};

	// var tb = LS.get(lsdbid+'.'+tableid);
	// if(!tb) tb = [];
	// tb = tb.concat(value);
	// LS.set(lsdbid+'.'+tableid, tb);
//	console.log(lsdbid+'.'+tableid, tb);
//	console.log(localStorage[lsdbid+'.'+tableid]);
	// if(cb) cb(res);
	// return res;
};


IDB.fromTable = function(databaseid, tableid, cb, idx, query){
	// console.log(arguments);
	// console.trace();
	var ixdbid = alasql.databases[databaseid].ixdbid;
	var request = window.indexedDB.open(ixdbid);
	request.onsuccess = function(event) {
	  	var res = [];
	  	var ixdb = event.target.result;
//	  	console.log(444,ixdb, tableid, ixdbid);
	  	var tx = ixdb.transaction([tableid]);
	  	var store = tx.objectStore(tableid);
	  	var cur = store.openCursor();
//	  	console.log(cur);
	  	cur.onblocked = function(event) {
//	  		console.log('blocked');
	  	}
	  	cur.onerror = function(event) {
//	  		console.log('error');
	  	}
	  	cur.onsuccess = function(event) {
//	  		console.log('success');
		  	var cursor = event.target.result;
//		  		console.log(222,event);
//		  		console.log(333,cursor);
		  	if(cursor) {
		  		res.push(cursor.value);
		  		cursor.continue();
		  	} else {
//		  		console.log(555, res,idx,query);
		  		ixdb.close();
		  		cb(res, idx, query);
		  	}
	  	}
	}		
}

IDB.deleteFromTable = function(databaseid, tableid, wherefn,params, cb){
	// console.log(arguments);
	// console.trace();
	var ixdbid = alasql.databases[databaseid].ixdbid;
	var request = window.indexedDB.open(ixdbid);
	request.onsuccess = function(event) {
	  	var res = [];
	  	var ixdb = event.target.result;
//	  	console.log(444,ixdb, tableid, ixdbid);
	  	var tx = ixdb.transaction([tableid], 'readwrite');
	  	var store = tx.objectStore(tableid);
	  	var cur = store.openCursor();
	  	var num = 0;
//	  	console.log(cur);
	  	cur.onblocked = function(event) {
//	  		console.log('blocked');
	  	}
	  	cur.onerror = function(event) {
//	  		console.log('error');
	  	}
	  	cur.onsuccess = function(event) {
//	  		console.log('success');
		  	var cursor = event.target.result;
//		  		console.log(222,event);
//		  		console.log(333,cursor);
		  	if(cursor) {
		  		if((!wherefn) || wherefn(cursor.value,params)) {
//		  		console.log(cursor);
		  			cursor.delete();
		  			num++;
		  		}
		  		cursor.continue();
		  	} else {
//		  		console.log(555, res,idx,query);
		  		ixdb.close();
		  		cb(num);
		  	}
	  	}
	}		
}

IDB.updateTable = function(databaseid, tableid, assignfn, wherefn, params, cb){
	// console.log(arguments);
	// console.trace();
	var ixdbid = alasql.databases[databaseid].ixdbid;
	var request = window.indexedDB.open(ixdbid);
	request.onsuccess = function(event) {
	  	var res = [];
	  	var ixdb = event.target.result;
//	  	console.log(444,ixdb, tableid, ixdbid);
	  	var tx = ixdb.transaction([tableid], 'readwrite');
	  	var store = tx.objectStore(tableid);
	  	var cur = store.openCursor();
	  	var num = 0;
//	  	console.log(cur);
	  	cur.onblocked = function(event) {
//	  		console.log('blocked');
	  	}
	  	cur.onerror = function(event) {
//	  		console.log('error');
	  	}
	  	cur.onsuccess = function(event) {
//	  		console.log('success');
		  	var cursor = event.target.result;
//		  		console.log(222,event);
//		  		console.log(333,cursor);
		  	if(cursor) {
		  		if((!wherefn) || wherefn(cursor.value,params)) {
		  		//console.log(cursor);
		  			var r = cursor.value;
					assignfn(r,params);
				//	console.log('update 363',r);
		  			cursor.update(r);
		  			num++;
		  		}
		  		cursor.continue();
		  	} else {
//		  		console.log(555, res,idx,query);
		  		ixdb.close();
		  		cb(num);
		  	}
	  	}
	}		
}

// Skip
}

//
// 91localstorage.js
// localStorage and DOM-Storage engine
// Date: 09.12.2014
// (c) Andrey Gershun
//

var LS = alasql.engines.LOCALSTORAGE = function (){};

LS.get = function(key) {
	var s = localStorage.getItem(key);
	if(typeof s == "undefined") return;
	var v = undefined;
	try {
		v = JSON.parse(s); 
	} catch(err) {
		throw new Error('Cannot parse JSON '+s);
	}
	return v;
};

LS.set = function(key, value){
	if(typeof value == 'undefined') localStorage.removeItem(key);
	else localStorage.setItem(key,JSON.stringify(value)); 
}

LS.createDatabase = function(lsdbid, args, ifnotexists, dbid, cb){
	var res = 1;
	var ls = LS.get('alasql');
	if(!(ifnotexists && ls && ls.databases && ls.databases[lsdbid])) {
		if(!ls) ls = {databases:{}};
		if(ls.databases && ls.databases[lsdbid]) {
			throw new Error('localStorage: Cannot create new database "'+lsdbid+'" because it already exists');
		}
		ls.databases[lsdbid] = true;
		LS.set('alasql',ls);
		LS.set(lsdbid,{databaseid:lsdbid, tables:{}});
	} else {
		res = 0;
	}
	if(cb) cb(res);
	return res;
};

LS.dropDatabase = function(lsdbid, ifexists, cb){
	var res = 1;
	var ls = LS.get('alasql');
	if(!(ifexists && ls && ls.databases && !ls.databases[lsdbid])) {
		if(!ls) {
			if(!ifexists) {
				throw new Error('There are no alasql databases in localStorage');
			} else {
				return 0;
			}
		};
//		console.log(999,ls.databases,ls.databases[lsdbid], lsdbid);	
		if(ls.databases && !ls.databases[lsdbid]) {
			throw new Error('localStorage: Cannot drop database "'+lsdbid+'" because there is no such database');
		}
		delete ls.databases[lsdbid];
		LS.set('alasql',ls);
		
		var db = LS.get(lsdbid);
		for(var tableid in db.tables) {
//			console.log('remove',lsdbid,tableid);
			localStorage.removeItem(lsdbid+'.'+tableid);
		}

		localStorage.removeItem(lsdbid);
	} else {
		res = 0;
	}
	if(cb) cb(res);
	return res;
};


LS.attachDatabase = function(lsdbid, dbid, args, params, cb){
	var res = 1;
	if(alasql.databases[dbid]) {
		throw new Error('Unable to attach database as "'+dbid+'" because it already exists');
	};
	var db = new alasql.Database(dbid || lsdbid);
	db.engineid = "LOCALSTORAGE";
	db.lsdbid = lsdbid;
	db.tables = LS.get(lsdbid).tables;
	// IF AUTOCOMMIT IS OFF then copy data to memory
	if(!alasql.options.autocommit) {
		if(db.tables){
			for(var tbid in db.tables) {
				db.tables[tbid].data = LS.get(db.lsdbid+'.'+tbid);
			}
		}
	}
	if(cb) res = cb(res);
	return res;
};

LS.showDatabases = function(like, cb) {
	var res = [];
	var ls = LS.get('alasql');
	if(like) {
		var relike = new RegExp(like.value.replace(/\%/g,'.*'),'g');
	}
	if(ls && ls.databases) {
		for(dbid in ls.databases) {
			res.push({databaseid: dbid});
		};
		if(like && res && res.length > 0) {
			res = res.filter(function(d){
				return d.databaseid.match(relike);
			});
		}		
	};
	if(cb) cb(res);
	return res;
};

LS.createTable = function(databaseid, tableid, ifnotexists, cb) {
	var lsdbid = alasql.databases[databaseid].lsdbid;
	var tb = LS.get(lsdbid+'.'+tableid);
	var res = 1;

	if(tb && !ifnotexists) {
		throw new Error('Table "'+tableid+'" alsready exists in localStorage database "'+lsdbid+'"');
	};
	var lsdb = LS.get(lsdbid);
	var table = alasql.databases[databaseid].tables[tableid];
	lsdb.tables[tableid] = {columns:table.columns};

	LS.set(lsdbid, lsdb);
	LS.set(lsdbid+'.'+tableid, []);

	if(cb) cb(res);
	return res;
}

LS.dropTable = function (databaseid, tableid, ifexists, cb) {
//	console.log(arguments);
	var res = 1;
	var lsdbid = alasql.databases[databaseid].lsdbid;
	if(alasql.options.autocommit) {
		var lsdb = LS.get(lsdbid);
	} else {
		var lsdb = alasql.databases[databaseid];
	}
	if(!ifexists && !lsdb.tables[tableid]) {
		throw new Error('Cannot drop table "'+tableid+'" in localStorage, because it does not exist');
	};
	delete lsdb.tables[tableid];
	LS.set(lsdbid, lsdb);
	localStorage.removeItem(lsdbid+'.'+tableid);
	if(cb) cb(res);
	return res;
}

LS.fromTable = function(databaseid, tableid, cb, idx, query) {
//	console.log(998, databaseid, tableid, cb);
	var lsdbid = alasql.databases[databaseid].lsdbid;
	var res = LS.get(lsdbid+'.'+tableid);
	if(cb) res = cb(res, idx, query);
	return res;
};

LS.intoTable = function(databaseid, tableid, value, columns, cb) {
//	console.log('intoTable',databaseid, tableid, value, cb);
	var lsdbid = alasql.databases[databaseid].lsdbid;
	var res = value.length;
	var tb = LS.get(lsdbid+'.'+tableid);
	if(!tb) tb = [];
	tb = tb.concat(value);
	LS.set(lsdbid+'.'+tableid, tb);
//	console.log(lsdbid+'.'+tableid, tb);
//	console.log(localStorage[lsdbid+'.'+tableid]);
//console.log(165,res);
	if(cb) cb(res);
//console.log(167,res);
	return res;
};

LS.loadTableData = function(databaseid, tableid){
	var db = alasql.databases[databaseid];
	var lsdbid = alasql.databases[databaseid].lsdbid;
	db.tables[tableid].data = LS.get(lsdbid+'.'+tableid);
}

LS.saveTableData = function(databaseid, tableid){
	var db = alasql.databases[databaseid];
	var lsdbid = alasql.databases[databaseid].lsdbid;
	LS.set(lsdbid+'.'+tableid,db.tables[tableid].data);
	db.tables[tableid].data = null;
}

LS.commit = function(databaseid, cb) {
//	console.log('COMMIT');
	var db = alasql.databases[databaseid];
	var lsdbid = alasql.databases[databaseid].lsdbid;
	var lsdb = {databaseid:lsdbid, tables:{}};
	if(db.tables) {
		for(var tbid in db.tables) {
			lsdb.tables[tbid] = {columns: db.tables[tbid].columns};
			LS.set(lsdbid+'.'+tbid, db.tables[tbid].data);
		};
	}
	LS.set(lsdbid,lsdb);
	return 1;
};

LS.begin = LS.commit;

LS.rollback = function(databaseid, cb) {
//	console.log(207,databaseid);
	var db = alasql.databases[databaseid];
	db.dbversion++;
//	console.log(db.dbversion)
	var lsdbid = alasql.databases[databaseid].lsdbid;
	var lsdb = LS.get(lsdbid);
//	if(!alasql.options.autocommit) {
		if(lsdb.tables){
			for(var tbid in lsdb.tables) {
				var tb = new alasql.Table({columns: db.tables[tbid].columns});
				extend(tb,lsdb.tables[tbid]);
				lsdb.tables[tbid] = tb;
				if(!alasql.options.autocommit) {
					lsdb.tables[tbid].data = LS.get(db.lsdbid+'.'+tbid);
				}
				lsdb.tables[tbid].indexColumns();

				// index columns
				// convert types
			}
		}
//	}
	delete alasql.databases[databaseid];
	alasql.databases[databaseid] = new alasql.Database(databaseid);
	extend(alasql.databases[databaseid], lsdb);
	alasql.databases[databaseid].databaseid = databaseid;
	alasql.databases[databaseid].engineid = 'LOCALSTORAGE';
//console.log(999, alasql.databases[databaseid]);
}



//
// 91websql.js
// WebSQL database support
// (c) 2014, Andrey Gershun
//

var SQLITE = alasql.engines.SQLITE = function (){};

SQLITE.createDatabase = function(wdbid, args, ifnotexists, dbid, cb){
	throw new Error('Connot create SQLITE database in memory. Attach it.');
};

SQLITE.dropDatabase = function(databaseid){
	throw new Error('This is impossible to drop SQLite database. Detach it.');
};

SQLITE.attachDatabase = function(sqldbid, dbid, args, params, cb){
	var res = 1;
	if(alasql.databases[dbid]) {
		throw new Error('Unable to attach database as "'+dbid+'" because it already exists');
	};


	if(args[0] && (args[0] instanceof yy.StringValue)
		|| (args[0] instanceof yy.ParamValue)) {

		if(args[0] instanceof yy.StringValue) {
			var value = args[0].value;
		} else if(args[0] instanceof yy.ParamValue) {
			var value = params[args[0].param];
		}
		alasql.utils.loadBinaryFile(value,true,function(data){
			var db = new alasql.Database(dbid || sqldbid);
			db.engineid = "SQLITE";
			db.sqldbid = sqldbid;
			var sqldb = db.sqldb = new SQL.Database(data);
			db.tables = [];
			var tables = sqldb.exec("SELECT * FROM sqlite_master WHERE type='table'")[0].values;

		   	tables.forEach(function(tbl){
		   		db.tables[tbl[1]] = {};
		   		var columns = db.tables[tbl[1]].columns = [];
		   		var ast = alasql.parse(tbl[4]);
//		   		console.log(ast);
		   		var coldefs = ast.statements[0].columns;
		   		if(coldefs && coldefs.length>0) {
		   			coldefs.forEach(function(cd){
			   			columns.push(cd);
		   			});
		   		}

		   	});
//		   	console.log(35,db.tables);

		   	cb(1);
		}, function(err){
			throw new Error('Cannot open SQLite database file "'+args[0].value+'"');
		})
		return res;
	} else {
		throw new Error('Cannot attach SQLite database without a file');
	};

	return res;
}

SQLITE.fromTable = function(databaseid, tableid, cb, idx, query){
	var data = alasql.databases[databaseid].sqldb.exec("SELECT * FROM "+tableid);
	var columns = query.sources[idx].columns = [];
	if(data[0].columns.length > 0) {
		data[0].columns.forEach(function(columnid) {
			columns.push({columnid:columnid});
		});
	};

	var res = [];
	if(data[0].values.length > 0) {
		data[0].values.forEach(function(d){
			var r = {};
			columns.forEach(function(col,idx){
				r[col.columnid] = d[idx];
			});
			res.push(r);
		});
	}
	if(cb) cb(res, idx, query);
};

SQLITE.intoTable = function(databaseid, tableid, value, columns, cb) {
	var sqldb = alasql.databases[databaseid].sqldb;
	for(var i=0, ilen = value.length;i<ilen;i++) {
		var s = "INSERT INTO "+tableid+" (";
		var d = value[i];
		var keys = Object.keys(d);
		s += keys.join(",");
		s += ") VALUES (";
		s += keys.map(function(k){
			v = d[k];
			if(typeof v == 'string') v = "'"+v+"'";
			return v;
		}).join(",");
		s += ")";
		sqldb.exec(s);
	};
	var res = ilen;
	if(cb) cb(res);
	return res;
};



//
// 91localstorage.js
// localStorage and DOM-Storage engine
// Date: 09.12.2014
// (c) Andrey Gershun
//

var FS = alasql.engines.FILESTORAGE = alasql.engines.FILE = function (){};

/*
FS.get = function(key) {
	var s = localStorage.getItem(key);
	if(typeof s == "undefined") return;
	var v = undefined;
	try {
		v = JSON.parse(s); 
	} catch(err) {
		throw new Error('Cannot parse JSON '+s);
	}
	return v;
};

LS.set = function(key, value){
	if(typeof value == 'undefined') localStorage.removeItem(key);
	else localStorage.setItem(key,JSON.stringify(value)); 
}
*/

FS.createDatabase = function(fsdbid, args, ifnotexists, dbid, cb){
//	console.log(arguments);
	var res = 1;
	var filename = args[0].value;
//	console.log('filename',filename);
	alasql.utils.fileExists(filename, function(fex){
		// console.log('fex:',arguments);
		if(fex) {
			if(ifnotexists) {
				res = 0;
				if(cb) res = cb(res);
				return res;
			} else {
				throw new Error('Cannot create new database file, because it alreagy exists');
			} 
		} else {
			var data = {tables:{}};
			alasql.utils.saveFile(filename,JSON.stringify(data),function(data){
				if(cb) res = cb(res);
			});
		}
	});
	return res;
};


FS.dropDatabase = function(fsdbid, ifexists, cb){
	var res;
	var filename = fsdbid.value;
//	console.log('filename',filename);
	alasql.utils.fileExists(filename, function(fex){
		if(fex) {
			res = 1;
			alasql.utils.deleteFile(filename, function(){
				res = 1;
				if(cb) res = cb(res);
			});
		} else {
			if(!ifexists) {
				throw new Error('Cannot drop database file, because it does not exist');
			}
			res = 0;
			if(cb) res = cb(res);
		}
	});
	return res;
};


FS.attachDatabase = function(fsdbid, dbid, args, params, cb){
//	console.log(arguments);
	var res = 1;
	if(alasql.databases[dbid]) {
		throw new Error('Unable to attach database as "'+dbid+'" because it already exists');
	};
	var db = new alasql.Database(dbid || fsdbid);
	db.engineid = "FILESTORAGE";
//	db.fsdbid = fsdbid;
	db.filename = args[0].value;
	loadFile(db.filename, !!cb, function(s){
		try {
			db.data = JSON.parse(s);
		} catch(err) {
			throw new Error('Data in FileStorage database are corrupted');
		}
		db.tables = db.data.tables;
		// IF AUTOCOMMIT IS OFF then copy data to memory
		if(!alasql.options.autocommit) {
			if(db.tables){
				for(var tbid in db.tables) {
					db.tables[tbid].data = db.data[tbid];
				}
			}
		}
		if(cb) res = cb(res);
	});
	return res;
};

/*
FS.showDatabases = function(like, cb) {
	var res = [];
	var ls = LS.get('alasql');
	if(like) {
		var relike = new RegExp(like.value.replace(/\%/g,'.*'),'g');
	}
	if(ls && ls.databases) {
		for(dbid in ls.databases) {
			res.push({databaseid: dbid});
		};
		if(like && res && res.length > 0) {
			res = res.filter(function(d){
				return d.databaseid.match(relike);
			});
		}		
	};
	if(cb) cb(res);
	return res;
};
*/

FS.createTable = function(databaseid, tableid, ifnotexists, cb) {
	var db = alasql.databases[databaseid];
	var tb = db.data[tableid];
	var res = 1;

	if(tb && !ifnotexists) {
		throw new Error('Table "'+tableid+'" alsready exists in the database "'+fsdbid+'"');
	};
	var table = alasql.databases[databaseid].tables[tableid];
	db.data.tables[tableid] = {columns:table.columns};
	db.data[tableid] = [];

	FS.updateFile(databaseid);	

	if(cb) cb(res);
	return res;
};

FS.updateFile = function(databaseid) {
//	console.log('update start');
	var db = alasql.databases[databaseid];
	if(db.issaving) {
		db.postsave = true;
		return;
	};
	db.issaving = true;
	db.postsave = false;
	alasql.utils.saveFile(db.filename, JSON.stringify(db.data), function(){
		db.issaving = false;
//		console.log('update finish');

		if(db.postsave) {
			setTimeout(function(){
				FS.updateFile(databaseid);
			},50); // TODO Test with different timeout parameters
		};
	});
};

FS.dropTable = function (databaseid, tableid, ifexists, cb) {
	var res = 1;
	var db = alasql.databases[databaseid];
	if(!ifexists && !db.tables[tableid]) {
		throw new Error('Cannot drop table "'+tableid+'" in fileStorage, because it does not exist');
	};
	delete db.tables[tableid];
	delete db.data.tables[tableid];
	delete db.data[tableid];
	FS.updateFile(databaseid);	
	if(cb) cb(res);
	return res;
}

FS.fromTable = function(databaseid, tableid, cb, idx, query) {
//	console.log(998, databaseid, tableid, cb);
	var db = alasql.databases[databaseid];
	var res = db.data[tableid];
	if(cb) res = cb(res, idx, query);
	return res;
};

FS.intoTable = function(databaseid, tableid, value, columns, cb) {
	var db = alasql.databases[databaseid];
	var res = value.length;
	var tb = db.data[tableid];
	if(!tb) tb = [];
	db.data[tableid] = tb.concat(value);
	FS.updateFile(databaseid);	
	if(cb) cb(res);
	return res;
};

FS.loadTableData = function(databaseid, tableid){
	var db = alasql.databases[databaseid];
	db.tables[tableid].data = db.data[tableid];
}

FS.saveTableData = function(databaseid, tableid){
	var db = alasql.databases[databaseid];
	db.data[tableid] = db.tables[tableid].data;
	db.tables[tableid].data = null;
	FS.updateFile(databaseid);	
}

FS.commit = function(databaseid, cb) {
//	console.log('COMMIT');
	var db = alasql.databases[databaseid];
	var fsdb = {tables:{}};
	if(db.tables) {
		for(var tbid in db.tables) {
			db.data.tables[tbid] = {columns: db.tables[tbid].columns};
			db.data[tbid] = db.tables[tbid].data;
		};
	};
	FS.updateFile(databaseid);
	return 1;
};

FS.begin = FS.commit;

FS.rollback = function(databaseid, cb) {
	var res = 1;
	var db = alasql.databases[databaseid];
	db.dbversion++;
//	console.log(db.dbversion)
//	var lsdbid = alasql.databases[databaseid].lsdbid;
//	lsdb = LS.get(lsdbid);
	wait();
	function wait() {
		setTimeout(function(){
			if(db.issaving) {
				return wait();
			} else {
				alasql.loadFile(db.filename,!!cb,function(data){
					db.data = data;
					db.tables = {};
					for(var tbid in db.data.tables) {
						var tb = new alasql.Table({columns: db.data.tables[tbid].columns});
						extend(tb,db.data.tables[tbid]);
						db.tables[tbid] = tb;
						if(!alasql.options.autocommit) {
							db.tables[tbid].data = db.data[tbid];
						}
						db.tables[tbid].indexColumns();

						// index columns
						// convert types
					}

					delete alasql.databases[databaseid];
					alasql.databases[databaseid] = new alasql.Database(databaseid);
					extend(alasql.databases[databaseid], db);
					alasql.databases[databaseid].engineid = 'FILESTORAGE';
					alasql.databases[databaseid].filename = db.filename;

					if(cb) res = cb(res);

				});
			};
		},100);		
	};

//	if(!alasql.options.autocommit) {
/*		if(lsdb.tables){
			for(var tbid in lsdb.tables) {
				var tb = new alasql.Table({columns: db.tables[tbid].columns});
				extend(tb,lsdb.tables[tbid]);
				lsdb.tables[tbid] = tb;
				if(!alasql.options.autocommit) {
					lsdb.tables[tbid].data = LS.get(db.lsdbid+'.'+tbid);
				}
				lsdb.tables[tbid].indexColumns();

				// index columns
				// convert types
			}
		}
//	}
*/
//console.log(999, alasql.databases[databaseid]);
}



if((typeof exports != 'object') && (typeof importScripts != 'function') && (typeof document == 'object')) {

/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 2015-03-04
 *
 * By Eli Grey, http://eligrey.com
 * License: X11/MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */

/*global self */
/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs
  // IE 10+ (native saveAs)
  || (typeof navigator !== "undefined" &&
      navigator.msSaveOrOpenBlob && navigator.msSaveOrOpenBlob.bind(navigator))
  // Everyone else
  || (function(view) {
	"use strict";
	// IE <10 is explicitly unsupported
	if (typeof navigator !== "undefined" &&
	    /MSIE [1-9]\./.test(navigator.userAgent)) {
		return;
	}
	var
		  doc = view.document
		  // only get URL when necessary in case Blob.js hasn't overridden it yet
		, get_URL = function() {
			return view.URL || view.webkitURL || view;
		}
		, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
		, can_use_save_link = "download" in save_link
		, click = function(node) {
			var event = doc.createEvent("MouseEvents");
			event.initMouseEvent(
				"click", true, false, view, 0, 0, 0, 0, 0
				, false, false, false, false, 0, null
			);
			node.dispatchEvent(event);
		}
		, webkit_req_fs = view.webkitRequestFileSystem
		, req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem
		, throw_outside = function(ex) {
			(view.setImmediate || view.setTimeout)(function() {
				throw ex;
			}, 0);
		}
		, force_saveable_type = "application/octet-stream"
		, fs_min_size = 0
		// See https://code.google.com/p/chromium/issues/detail?id=375297#c7 and
		// https://github.com/eligrey/FileSaver.js/commit/485930a#commitcomment-8768047
		// for the reasoning behind the timeout and revocation flow
		, arbitrary_revoke_timeout = 500 // in ms
		, revoke = function(file) {
			var revoker = function() {
				if (typeof file === "string") { // file is an object URL
					get_URL().revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			};
			if (view.chrome) {
				revoker();
			} else {
				setTimeout(revoker, arbitrary_revoke_timeout);
			}
		}
		, dispatch = function(filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver["on" + event_types[i]];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		}
		, FileSaver = function(blob, name) {
			// First try a.download, then web filesystem, then object URLs
			var
				  filesaver = this
				, type = blob.type
				, blob_changed = false
				, object_url
				, target_view
				, dispatch_all = function() {
					dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				// on any filesys errors revert to saving with object URLs
				, fs_error = function() {
					// don't create more object URLs than needed
					if (blob_changed || !object_url) {
						object_url = get_URL().createObjectURL(blob);
					}
					if (target_view) {
						target_view.location.href = object_url;
					} else {
						var new_tab = view.open(object_url, "_blank");
						if (new_tab == undefined && typeof safari !== "undefined") {
							//Apple do not allow window.open, see http://bit.ly/1kZffRI
							view.location.href = object_url
						}
					}
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
					revoke(object_url);
				}
				, abortable = function(func) {
					return function() {
						if (filesaver.readyState !== filesaver.DONE) {
							return func.apply(this, arguments);
						}
					};
				}
				, create_if_not_found = {create: true, exclusive: false}
				, slice
			;
			filesaver.readyState = filesaver.INIT;
			if (!name) {
				name = "download";
			}
			if (can_use_save_link) {
				object_url = get_URL().createObjectURL(blob);
				save_link.href = object_url;
				save_link.download = name;
				click(save_link);
				filesaver.readyState = filesaver.DONE;
				dispatch_all();
				revoke(object_url);
				return;
			}
			// prepend BOM for UTF-8 XML and text/plain types
			if (/^\s*(?:text\/(?:plain|xml)|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
				blob = new Blob(["\ufeff", blob], {type: blob.type});
			}
			// Object and web filesystem URLs have a problem saving in Google Chrome when
			// viewed in a tab, so I force save with application/octet-stream
			// http://code.google.com/p/chromium/issues/detail?id=91158
			// Update: Google errantly closed 91158, I submitted it again:
			// https://code.google.com/p/chromium/issues/detail?id=389642
			if (view.chrome && type && type !== force_saveable_type) {
				slice = blob.slice || blob.webkitSlice;
				blob = slice.call(blob, 0, blob.size, force_saveable_type);
				blob_changed = true;
			}
			// Since I can't be sure that the guessed media type will trigger a download
			// in WebKit, I append .download to the filename.
			// https://bugs.webkit.org/show_bug.cgi?id=65440
			if (webkit_req_fs && name !== "download") {
				name += ".download";
			}
			if (type === force_saveable_type || webkit_req_fs) {
				target_view = view;
			}
			if (!req_fs) {
				fs_error();
				return;
			}
			fs_min_size += blob.size;
			req_fs(view.TEMPORARY, fs_min_size, abortable(function(fs) {
				fs.root.getDirectory("saved", create_if_not_found, abortable(function(dir) {
					var save = function() {
						dir.getFile(name, create_if_not_found, abortable(function(file) {
							file.createWriter(abortable(function(writer) {
								writer.onwriteend = function(event) {
									target_view.location.href = file.toURL();
									filesaver.readyState = filesaver.DONE;
									dispatch(filesaver, "writeend", event);
									revoke(file);
								};
								writer.onerror = function() {
									var error = writer.error;
									if (error.code !== error.ABORT_ERR) {
										fs_error();
									}
								};
								"writestart progress write abort".split(" ").forEach(function(event) {
									writer["on" + event] = filesaver["on" + event];
								});
								writer.write(blob);
								filesaver.abort = function() {
									writer.abort();
									filesaver.readyState = filesaver.DONE;
								};
								filesaver.readyState = filesaver.WRITING;
							}), fs_error);
						}), fs_error);
					};
					dir.getFile(name, {create: false}, abortable(function(file) {
						// delete file if it already exists
						file.remove();
						save();
					}), abortable(function(ex) {
						if (ex.code === ex.NOT_FOUND_ERR) {
							save();
						} else {
							fs_error();
						}
					}));
				}), fs_error);
			}), fs_error);
		}
		, FS_proto = FileSaver.prototype
		, saveAs = function(blob, name) {
			return new FileSaver(blob, name);
		}
	;
	FS_proto.abort = function() {
		var filesaver = this;
		filesaver.readyState = filesaver.DONE;
		dispatch(filesaver, "abort");
	};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;

	FS_proto.error =
	FS_proto.onwritestart =
	FS_proto.onprogress =
	FS_proto.onwrite =
	FS_proto.onabort =
	FS_proto.onerror =
	FS_proto.onwriteend =
		null;

	return saveAs;
}(
	   typeof self !== "undefined" && self
	|| typeof window !== "undefined" && window
	|| this.content
));
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if (typeof module !== "undefined" && module.exports) {
  module.exports.saveAs = saveAs;
} else if ((typeof define !== "undefined" && define !== null) && (define.amd != null)) {
  define([], function() {
    return saveAs;
  });
}

/*
//
// Last part of Alasql.js
// Date: 03.11.2014
// (c) 2014, Andrey Gershun
//
*/

// This is a final part of Alasql

// FileSaveAs
	alasql.utils.saveAs = saveAs;

};

// Create default database
new Database("alasql");

// Set default database
alasql.use("alasql");

return alasql;
}));

/*if (typeof importScripts === 'function') {
	// Nothing
} else */ 
if(typeof exports !== 'object') {

	alasql.worker = function(path, paths, cb) {
	//	var path;
		if(path === true){
			path = undefined;
		}

		if (typeof path === "undefined") {
			var sc = document.getElementsByTagName('script');
			for(var i=0;i<sc.length;i++) {
				if (sc[i].src.substr(-16).toLowerCase() === 'alasql-worker.js') {
					path = sc[i].src.substr(0,sc[i].src.length-16)+'alasql.js'; 
					break;
				} else if (sc[i].src.substr(-20).toLowerCase() === 'alasql-worker.min.js') {
					path = sc[i].src.substr(0,sc[i].src.length-20)+'alasql.min.js';
					break;
				} else if (sc[i].src.substr(-9).toLowerCase() === 'alasql.js') {
					path = sc[i].src; 
					break;
				} else if (sc[i].src.substr(-13).toLowerCase() === 'alasql.min.js') {
					path = sc[i].src.substr(0,sc[i].src.length-13)+'alasql.min.js'; 
					break;
				}
			}
		}

		if(typeof path === "undefined") {
			throw new Error('Path to alasql.js is not specified');
		} else if(path !== false) {

			var js = "importScripts('";
				js += path;
				js+="');self.onmessage = function(event) {"+
			"alasql(event.data.sql,event.data.params, function(data){"+
			"postMessage({id:event.data.id, data:data});});}";

			var blob = new Blob([js], {"type": "text\/plain"});
			alasql.webworker = new Worker(URL.createObjectURL(blob));

			alasql.webworker.onmessage = function(event) {
				var id = event.data.id;
	//			console.log('onmessage',alasql.buffer,id);
				alasql.buffer[id](event.data.data);
				delete alasql.buffer[id];
			};

			alasql.webworker.onerror = function(e){
				throw e;
			}

			if(arguments.length > 1) {
				var sql = 'REQUIRE ' + paths.map(function(p){
					return '"'+p+'"';
				}).join(",");
				alasql(sql,[],cb);
			}

		} else if(path === false) {
			delete alasql.webworker;
			return;
		}
	};

}
