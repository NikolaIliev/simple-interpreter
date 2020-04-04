const { promisify } = require('util')
const prompt = require('prompt')

class Token {
  static TYPES = {
    'FACTOR': 'FACTOR',
    'PLUS': 'PLUS',
    'MINUS': 'MINUS',
    'MULT': 'MULT',
    'DIV': 'DIV'
  }

  constructor(type, value) {
    if (!Token.TYPES.hasOwnProperty(type)) {
      throw new Error(`Unknown token type ${type}`)
    }

    this.type = type
    this.value = value
  }
}

class Lexer {
  constructor(text) {
    this.text = text
    this.pos = -1
    this.currentChar = null
  }

  advance() {
    this.pos++

    if (this.pos < this.text.length) {
      this.currentChar = this.text[this.pos]
    } else {
      this.currentChar = null
    }
  }

  isCurrentCharDigit() {
    return this.currentChar && this.currentChar >= '0' && this.currentChar <= '9'
  }

  skipWhitespace() {
    while (this.currentChar && this.currentChar === ' ') {
      this.advance()
    }
  }

  plus() {
    return new Token(Token.TYPES.PLUS)
  }

  minus() {
    return new Token(Token.TYPES.MINUS)
  }

  mult() {
    return new Token(Token.TYPES.MULT)
  }

  div() {
    return new Token(Token.TYPES.DIV)
  }

  integer() {
    let integer = ''

    do {
      integer += this.currentChar
      this.advance()
    } while (this.isCurrentCharDigit())

    // by definition, all tokenizers must leave this.pos at the last char of their parsed token
    this.pos--

    return new Token(Token.TYPES.FACTOR, parseInt(integer))
  }

  // this.pos is expected be at -1 or at the last char of the previous token
  getToken() {
    this.advance()

    // this is before the null check as after skipping whitespace we may have arrived at the end
    if (this.currentChar === ' ') {
      this.skipWhitespace()
    }

    if (this.currentChar === null) {
      // reached the end
      return null
    }

    if (this.currentChar === '+') {
      return this.plus()
    } else if (this.currentChar === '-') {
      return this.minus()
    } else if (this.currentChar === '*') {
      return this.mult()
    } else if (this.currentChar === '/') {
      return this.div()
    } else if (this.isCurrentCharDigit()) {
      return this.integer()
    } else {
      throw new SyntaxError(`Unrecognized symbol: ${this.currentChar}`)
    }
  }
}

class Interpreter {
  constructor(text, lexer) {
    this.text = text
    this.lexer = lexer
    this.currentToken = this.lexer.getToken()
  }

  consume(type) {
    const currentTokenValue = this.currentToken.value

    if (this.currentToken.type !== type) {
      throw new SyntaxError(`Unexpected token ${this.currentToken}`)
    }

    this.currentToken = this.lexer.getToken()

    return currentTokenValue
  }

  factor() {
    const isNegative = this.currentToken.type === Token.TYPES.MINUS

    if (isNegative) {
      this.consume(Token.TYPES.MINUS)
    }

    const integer = parseInt(this.consume(Token.TYPES.FACTOR))

    return integer * (isNegative ? -1 : 1)
  }

  term() {
    let result = this.factor()

    while (
      this.currentToken && (
        this.currentToken.type === Token.TYPES.MULT ||
        this.currentToken.type === Token.TYPES.DIV
      )
    ) {
      const currentTokenType = this.currentToken.type
      this.consume(this.currentToken.type)
      const factor = this.factor()

      switch (currentTokenType) {
        case Token.TYPES.MULT:
          result *= factor
          break
        case Token.TYPES.DIV:
          result /= factor
          break
        default:
          break
      }
    }

    return result
  }

  expr() {
    let result = this.term()

    while (
      this.currentToken && (
        this.currentToken.type === Token.TYPES.PLUS ||
        this.currentToken.type === Token.TYPES.MINUS
      )
    ) {
      const currentTokenType = this.currentToken.type
      this.consume(this.currentToken.type)
      const factor = this.term()

      switch (currentTokenType) {
        case Token.TYPES.PLUS:
          result += factor
          break
        case Token.TYPES.MINUS:
          result -= factor
          break
        default:
          break
      }
    }

    return result
  }
}

const main = async () => {
  prompt.start()

  while (true) {
    const input = promisify(prompt.get.bind(prompt))
    const { 'expr>': expr } = await input('expr>')

    console.log(new Interpreter(expr, new Lexer(expr)).expr())
  }
}

main()

