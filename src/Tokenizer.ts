import { Llama2Tokenizer } from "@lenml/llama2-tokenizer";
import { load_vocab } from "@lenml/llama2-tokenizer-vocab-llama2";

export interface TokenizerResult {
  tokens: {
    token: string;
    encoding: number;
    start: number;
    end: number;
  }[];
}

const isHexToken = (token: string) => {
  return token.length === 6 && token.startsWith("<0x") && token.endsWith(">");
};

export class Tokenizer {
  protected tokenizer = new Llama2Tokenizer();
  constructor() {
    const vocab_model = load_vocab();
    this.tokenizer.install_vocab(vocab_model);
  }
  tokenize(text: string) {
    const tokens = this.tokenizer.tokenize(text);
    // 如果是 <0xXX> 形式的 token，那么之后的所有 hex 形式的都映射到同一个 range，直到找到不是 hex 的 token
    const result: TokenizerResult = {
      tokens: [],
    };
    let text_cursor = 0;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const encoding = this.tokenizer.encode(token)[0];

      if (isHexToken(token)) {
        const start = text_cursor;
        let end = text.length;
        const hex_tokens = [token];

        for (let j = i + 1; j < tokens.length; j++) {
          const next_token = tokens[j];
          if (isHexToken(next_token)) {
            hex_tokens.push(next_token);
          } else {
            // 找到这个token在text中的位置作为end
            const index = text.indexOf(next_token, text_cursor);
            end = index;
            break;
          }
        }
        for (let j = 0; j < hex_tokens.length; j++) {
          const token = hex_tokens[j];
          result.tokens.push({
            token: token,
            encoding: this.tokenizer.encode(token)[0],
            start: start,
            end: end,
          });
        }
        i += hex_tokens.length - 1;
        text_cursor = end;
      } else {
        result.tokens.push({
          token: token,
          encoding,
          start: text_cursor,
          end: text_cursor + token.length,
        });
        text_cursor += token.length;
      }
    }
    return result;
  }
}
