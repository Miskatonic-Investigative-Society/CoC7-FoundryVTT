/* global CONFIG foundry game Roll */
export default class CoC7AverageRoll extends Roll {
  /**
   * Convert DiceTerm classes to average value
   * @param {RollParseNode} node
   */
  static convertDiceTermToNumericTerm (node) {
    if (typeof node.class === 'string' && node.class === 'DiceTerm') {
      if (typeof node.number !== 'object' && typeof node.faces !== 'object') {
        node.class = 'NumericTerm'
        node.number = Math.floor((node.faces + 1) / 2 * node.number)
        delete node.faces
        delete node.modifiers
      } else {
        throw new Error(game.i18n.format('DICE.ErrorNotParsable', { formula: '?d?' }))
      }
    } else if (typeof node.class === 'string' && node.class === 'FunctionTerm') {
      if (typeof node.terms === 'object') {
        for (const offset in node.terms) {
          CoC7AverageRoll.convertDiceTermToNumericTerm(node.terms[offset])
        }
      }
    }
    if (typeof node.term === 'object') {
      CoC7AverageRoll.convertDiceTermToNumericTerm(node.term)
    }
    if (typeof node.operands === 'object') {
      for (const operand of node.operands) {
        CoC7AverageRoll.convertDiceTermToNumericTerm(operand)
      }
    }
  }

  /**
   * Instantiate the nodes in an AST sub-tree into RollTerm instances.
   * @param {RollParseNode} ast
   * @returns {RollTerm[]}
   */
  static instantiateAST (ast) {
    return CONFIG.Dice.parser.flattenTree(ast).map(node => {
      const cls = foundry.dice.terms[node.class] ?? foundry.dice.terms.RollTerm
      CoC7AverageRoll.convertDiceTermToNumericTerm(node)
      return cls.fromParseNode(node)
    })
  }
}
