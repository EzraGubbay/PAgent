import React from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';

interface TokenAttribute {
    text: string;
    bold?: boolean;
    italic?: boolean;
    strike?: boolean;
}

export const formatMarkdownInput = (text: string, baseStyle?: StyleProp<TextStyle>) => {
    if (!text) return null;

    const lines = text.split('\n');

    return lines.map((line, lineIndex) => {
        let lineStyle: TextStyle = {};

        // Block level parsing for styling only
        if (line.match(/^>\s/)) {
            lineStyle = { ...lineStyle, fontStyle: 'italic', color: '#888' }; 
        } else if (line.match(/^-\s/)) {
            lineStyle = { ...lineStyle, paddingLeft: 15 };
        } else if (line.match(/^\d+\.\s/)) {
            lineStyle = { ...lineStyle, paddingLeft: 15 };
        }

        // Inline token parsing
        const tokens: TokenAttribute[] = [];
        let currentText = "";
        let isBold = false;
        let isItalic = false;
        let isStrike = false;

        const pushCurrent = (tokenText: string, exactMatch: boolean = false) => {
            if (currentText) {
                tokens.push({ text: currentText, bold: isBold, italic: isItalic, strike: isStrike });
                currentText = "";
            }
            if (exactMatch && tokenText) {
                tokens.push({ text: tokenText, bold: isBold, italic: isItalic, strike: isStrike });
            }
        };

        let i = 0;
        while (i < line.length) {
            if (line.substr(i, 1) === "*") {
                pushCurrent("", false);
                isBold = !isBold;
                pushCurrent("*", true); 
                i += 1;
            } else if (line.substr(i, 1) === "~") {
                pushCurrent("", false);
                isStrike = !isStrike;
                pushCurrent("~", true);
                i += 1;
            } else if (line.substr(i, 1) === "_") {
                pushCurrent("", false);
                isItalic = !isItalic;
                pushCurrent("_", true);
                i += 1;
            } else {
                currentText += line[i];
                i++;
            }
        }
        pushCurrent("", false);

        return (
            <Text key={lineIndex} style={[baseStyle, lineStyle]}>
                {tokens.map((token, index) => {
                    let style: TextStyle = {};
                    if (token.bold) style.fontWeight = "bold";
                    if (token.italic) style.fontStyle = "italic";
                    if (token.strike) style.textDecorationLine = "line-through";
                    return (
                        <Text key={index} style={[style]}>
                            {token.text}
                        </Text>
                    );
                })}
                {lineIndex < lines.length - 1 ? '\n' : ''}
            </Text>
        );
    });
}
