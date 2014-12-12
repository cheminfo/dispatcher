/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2012, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

/* This file was autogenerated from tm bundles\io.tmbundle/Syntaxes/io.plist (uuid: ) */
/****************************************************************************************
 * IT MIGHT NOT BE PERFECT ...But it's a good start from an existing *.tmlanguage file. *
 * fileTypes                                                                            *
 ****************************************************************************************/

define(function(require, exports, module) {


var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var IoHighlightRules = function() {
    // regexp must not have capturing parentheses. Use (?:) instead.
    // regexps are ordered -> the first match is used

    this.$rules = { start: 
       [ { token: [ 'text', 'meta.empty-parenthesis.io' ],
           regex: '(\\()(\\))',
           comment: 'we match this to overload return inside () --Allan; scoping rules for what gets the scope have changed, so we now group the ) instead of the ( -- Rob' },
         { token: [ 'text', 'meta.comma-parenthesis.io' ],
           regex: '(\\,)(\\))',
           comment: 'We want to do the same for ,) -- Seckar; same as above -- Rob' },
         { token: 'keyword.control.io',
           regex: '\\b(?:if|ifTrue|ifFalse|ifTrueIfFalse|for|loop|reverseForeach|foreach|map|continue|break|while|do|return)\\b' },
         { token: 'punctuation.definition.comment.io',
           regex: '/\\*',
           push: 
            [ { token: 'punctuation.definition.comment.io',
                regex: '\\*/',
                next: 'pop' },
              { defaultToken: 'comment.block.io' } ] },
         { token: 'punctuation.definition.comment.io',
           regex: '//',
           push: 
            [ { token: 'comment.line.double-slash.io',
                regex: '$',
                next: 'pop' },
              { defaultToken: 'comment.line.double-slash.io' } ] },
         { token: 'punctuation.definition.comment.io',
           regex: '#',
           push: 
            [ { token: 'comment.line.number-sign.io', regex: '$', next: 'pop' },
              { defaultToken: 'comment.line.number-sign.io' } ] },
         { token: 'variable.language.io',
           regex: '\\b(?:self|sender|target|proto|protos|parent)\\b',
           comment: 'I wonder if some of this isn\'t variable.other.language? --Allan; scoping this as variable.language to match Objective-C\'s handling of \'self\', which is inconsistent with C++\'s handling of \'this\' but perhaps intentionally so -- Rob' },
         { token: 'keyword.operator.io',
           regex: '<=|>=|=|:=|\\*|\\||\\|\\||\\+|-|/|&|&&|>|<|\\?|@|@@|\\b(?:and|or)\\b' },
         { token: 'constant.other.io', regex: '\\bGL[\\w_]+\\b' },
         { token: 'support.class.io', regex: '\\b[A-Z](?:\\w+)?\\b' },
         { token: 'support.function.io',
           regex: '\\b(?:clone|call|init|method|list|vector|block|\\w+(?=\\s*\\())\\b' },
         { token: 'support.function.open-gl.io',
           regex: '\\bgl(?:u|ut)?[A-Z]\\w+\\b' },
         { token: 'punctuation.definition.string.begin.io',
           regex: '"""',
           push: 
            [ { token: 'punctuation.definition.string.end.io',
                regex: '"""',
                next: 'pop' },
              { token: 'constant.character.escape.io', regex: '\\\\.' },
              { defaultToken: 'string.quoted.triple.io' } ] },
         { token: 'punctuation.definition.string.begin.io',
           regex: '"',
           push: 
            [ { token: 'punctuation.definition.string.end.io',
                regex: '"',
                next: 'pop' },
              { token: 'constant.character.escape.io', regex: '\\\\.' },
              { defaultToken: 'string.quoted.double.io' } ] },
         { token: 'constant.numeric.io',
           regex: '\\b(?:0(?:x|X)[0-9a-fA-F]*|(?:[0-9]+\\.?[0-9]*|\\.[0-9]+)(?:(?:e|E)(?:\\+|-)?[0-9]+)?)(?:L|l|UL|ul|u|U|F|f)?\\b' },
         { token: 'variable.other.global.io', regex: 'Lobby\\b' },
         { token: 'constant.language.io',
           regex: '\\b(?:TRUE|true|FALSE|false|NULL|null|Null|Nil|nil|YES|NO)\\b' } ] }
    
    this.normalizeRules();
};

IoHighlightRules.metaData = { fileTypes: [ 'io' ],
      keyEquivalent: '^~I',
      name: 'Io',
      scopeName: 'source.io' }


oop.inherits(IoHighlightRules, TextHighlightRules);

exports.IoHighlightRules = IoHighlightRules;
});