import "./App.css";

import styled from "styled-components";
import { useEffect, useMemo, useRef, useState } from "react";

import HighlightWithinTextarea from "react-highlight-within-textarea";
import type { Editor } from "draft-js";
import { Tokenizer, TokenizerResult } from "./Tokenizer";

const example_text1 = `
Many words map to one token, but some don't: indivisible.

Unicode characters like emojis may be split into many tokens containing the underlying bytes: 🤚🏾

Sequences of characters commonly found next to each other may be grouped together: 1234567890
`.trim();

const Body = styled.div`
  width: 800px;
  flex: 1 0 auto;
  font-size: 16px;
  line-height: 24px;
  margin: 0 auto;
  max-width: 100%;
  padding: 40px 56px;
  overflow: hidden;

  h3 {
    font-size: 20px;
    line-height: 28px;
  }
  p {
    line-height: 1.5em;
    margin-bottom: 1em;
    margin-top: 1em;
  }
`;
const Header = styled.div`
  align-items: center;
  display: flex;
  margin-bottom: 1.4em;
  h1 {
    flex: 1 1 auto;
    margin: 0;
  }
`;
const EditorContainer = styled.div`
  font-family: var(--monospace);
  font-size: 15px;
  min-height: 200px;
  padding: 10px 12px;
  width: 100%;

  background-clip: padding-box;
  background-color: #fff;
  border: 1px solid var(--input-border);
  border-radius: 8px;
  box-sizing: border-box;
  color: var(--gray-800);
  display: inline-block;
  font-family: var(--sans-serif);
  font-weight: 400;
  line-height: 1.4;
  margin: 0;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  vertical-align: top;

  max-height: 500px;
  min-height: 200px;

  cursor: text;

  overflow: auto;

  mark {
    background: var(--primary-100a);
  }

  &:focus-within {
    border-color: var(--input-border-focus);
    box-shadow: 0 0 0 0.2rem var(--primary-100a);
    outline: 0;
  }
`;

const TokenizerOutput = styled.div`
  background: var(--gray-50);
  border-radius: 3px;
  margin-top: 1em;
  max-height: 500px;
  min-height: 200px;
  overflow: auto;
  padding: 10px 12px 45px;
  position: relative;
  transition: opacity 0.3s;
  word-break: break-word;

  span {
    font-family: var(--monospace);
    font-size: 15px;
  }
`;
const TokenStatsTitle = styled.div`
  color: var(--gray-900);
  font-weight: 700;
`;
const TokenStatsVal = styled.div`
  color: var(--gray-900);
  font-size: 28px;
  margin-top: 4px;
`;
const TokenStat = styled.div`
  display: inline-block;
  margin-right: 20px;
  min-width: 80px;
`;

const Button = styled.button`
  border: none;
  border-radius: 8px;
  box-sizing: border-box;
  cursor: pointer;
  display: inline-flex;
  font-weight: 500;
  justify-content: center;
  line-height: 1.4;
  position: relative;
  transition: box-shadow 0.3s, background-color 0.3s, color 0.3s;
  -webkit-user-select: none;
  user-select: none;

  font-size: 14px;
  line-height: 20px;
  background-color: #ececf1;
  color: #353740;
  padding: 6px 12px;

  & + & {
    margin-left: 8px;
  }

  &:hover {
    background-color: #d9d9e3;
  }
  &:active {
    background-color: #c5c5d2;
  }
`;

const TokenStatsContainer = ({
  value,
  tokens,
}: {
  value: string;
  tokens: TokenizerResult["tokens"];
}) => {
  // 压缩率
  const comp_rate = useMemo(() => {
    const rate = tokens.length / value.length;
    if (Number.isNaN(rate)) {
      return 0;
    }
    return (Math.round(rate * 100 * 100) / 100).toFixed(2);
  }, [tokens.length, value.length]);

  return (
    <div>
      <TokenStat>
        <TokenStatsTitle>Tokens</TokenStatsTitle>
        <TokenStatsVal>{tokens.length}</TokenStatsVal>
      </TokenStat>
      <TokenStat>
        <TokenStatsTitle>Chars</TokenStatsTitle>
        <TokenStatsVal>{value.length}</TokenStatsVal>
      </TokenStat>
      <TokenStat>
        <TokenStatsTitle>Compress Rate (tokens / chars)</TokenStatsTitle>
        <TokenStatsVal>{comp_rate}%</TokenStatsVal>
      </TokenStat>
    </div>
  );
};

const colors = [
  "rgba(107,64,216,.3)",
  "rgba(104,222,122,.4)",
  "rgba(244,172,54,.4)",
  "rgba(239,65,70,.4)",
  "rgba(39,181,234,.4)",
];

const useSelectionTokenRange = ({
  setHighlight,
}: {
  setHighlight: (range: [number, number] | null) => void;
}) => {
  useEffect(() => {
    const calcSelectionRange = () => {
      const selection = window.getSelection();
      if (!selection) {
        return;
      }
      const anchorNode = selection.anchorNode;
      const focusNode = selection.focusNode;
      if (!anchorNode || !focusNode) {
        return;
      }
      if (anchorNode === focusNode) {
        return;
      }
      const findData = (node: Node): [number, number] | null => {
        if (
          node instanceof HTMLElement &&
          node.dataset.start &&
          node.dataset.end
        ) {
          return [Number(node.dataset.start), Number(node.dataset.end)];
        }
        if (node.parentNode) {
          return findData(node.parentNode);
        }
        return null;
      };
      const anchor_data = findData(anchorNode);
      const end_data = findData(focusNode);
      if (anchor_data && end_data) {
        const start = Math.min(...anchor_data, ...end_data);
        const end = Math.max(...anchor_data, ...end_data);
        setHighlight([start, end]);
      }
    };

    let selecting = false;
    const mousedown_handler = () => {
      selecting = true;
      setHighlight(null);
    };
    const mouseup_handler = () => {
      if (selecting) {
        calcSelectionRange();
      }
      selecting = false;
    };
    const mousemove_handler = () => {
      if (selecting) {
        calcSelectionRange();
      }
    };

    window.addEventListener("mousedown", mousedown_handler);
    window.addEventListener("mouseup", mouseup_handler);
    window.addEventListener("mousemove", mousemove_handler);

    return () => {
      window.removeEventListener("mousedown", mousedown_handler);
      window.removeEventListener("mouseup", mouseup_handler);
      window.removeEventListener("mousemove", mousemove_handler);
    };
  }, [setHighlight]);
};

function App() {
  const [tokenizer] = useState(() => new Tokenizer());

  const [value, setValue] = useState("Potato potato tomato potato.");
  const hwtRef = useRef(null as null | Editor);

  const tokens = useMemo(() => {
    return tokenizer.tokenize(value).tokens;
  }, [tokenizer, value]);

  // highlight ranges
  const [highlight, setHighlight] = useState(null as null | [number, number]);
  const [selectionRange, setSelectionRange] = useState(
    null as null | [number, number]
  );

  useSelectionTokenRange({
    setHighlight: setSelectionRange,
  });
  return (
    <Body>
      <Header>
        <h1>🦙Llama2Tokenizer.js Playground</h1>
      </Header>
      <h3>Learn about language model tokenization</h3>
      <p>
        Language models process text using tokens, which are common sequences of
        characters found in text. Models understand statistical relationships
        between tokens to predict the next token in a sequence.
      </p>
      <p>
        This playground uses the{" "}
        <a href="https://github.com/lenML/llama2-tokenizer.js">
          llama2-tokenizer.js
        </a>{" "}
        to tokenize text. The library supports vocabularies for models like
        llama2, mistral, and zephyr. Key features include: fast, TypeScript
        support, high test coverage.
      </p>
      <p>
        You can use the tool below to see how text gets tokenized into tokens,
        and the total token count. Note different models use different
        tokenizers, so the same text can tokenize differently.
      </p>
      <p>Explore how text gets tokenized using this playground.</p>
      <EditorContainer
        onClick={() => {
          hwtRef.current?.focus();
        }}
      >
        <HighlightWithinTextarea
          ref={hwtRef}
          highlight={selectionRange || highlight}
          value={value}
          onChange={(value) => setValue(value)}
        />
      </EditorContainer>
      <div
        style={{
          marginTop: "1em",
          marginBottom: "1em",
        }}
      >
        <Button onClick={() => setValue("")}>Clear</Button>
        <Button onClick={() => setValue(example_text1)}>Show Example</Button>
      </div>
      <TokenStatsContainer value={value} tokens={tokens}></TokenStatsContainer>
      <TokenizerOutput>
        {tokens.map((token, i) => {
          const color = colors[i % colors.length];
          return (
            <span
              data-token={token.token}
              data-start={token.start}
              data-end={token.end}
              onMouseMove={() => {
                setHighlight([token.start, token.end]);
              }}
              onMouseLeave={() => {
                setHighlight(null);
              }}
              key={i + token.token}
              style={{ backgroundColor: color }}
            >
              {token.token}
            </span>
          );
        })}
      </TokenizerOutput>
      <p>
        A helpful rule of thumb is that one token generally corresponds to ~4
        characters of text for common English text. This translates to roughly ¾
        of a word (so 100 tokens ~= 75 words).
      </p>
    </Body>
  );
}

export default App;
