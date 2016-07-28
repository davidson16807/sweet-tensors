

syntax tensor = ( function() {

  let length_lookup = { 
    a:#`la`, b:#`lb`, c:#`lc`, d:#`ld`, e:#`le`, f:#`lf`, g:#`lg`, h:#`lh`, i:#`li`, 
    j:#`lj`, k:#`lk`, l:#`ll`, m:#`lm`, n:#`ln`, o:#`lo`, p:#`lp`, q:#`lq`, r:#`lr`, 
    s:#`ls`, t:#`lt`, u:#`lu`, v:#`lv`, w:#`lw`, x:#`lx`, y:#`ly`, z:#`lz`, 
  };
  let temp_variables = [
    #`$a`, #`$b`, #`$c`, #`$d`, #`$e`, #`$f`, #`$g`, #`$h`, #`$i`, 
    #`$j`, #`$k`, #`$l`, #`$m`, #`$n`, #`$o`, #`$p`, #`$q`, #`$r`, 
    #`$s`, #`$t`, #`$u`, #`$v`, #`$w`, #`$x`, #`$y`, #`$z`, 
  ]
  let operators = ['+','-','*','/',',','.','&','|','%','&&','||'];

  // check for any token that can belong to an indexible expression
  // an indexible expression is for instance "this.foo[i].getBar()[j]"
  let isIndexible = function(token) {
    return  token.isBrackets() || 
            token.isParens() || 
            token.isIdentifier() || 
            token.val() === '.';
  }

  let isTensorIndex = function(token, subtokens) {
    return  token.isBrackets() &&
            subtokens.length === 1 && 
            length_lookup[subtokens[0].val()] !== void 0;
  }

  // returns all tokens to the end of the file or block, whichever comes first
  let tokenize = function(ctx) {
    let tokens = [];
    let token;
    while(token = ctx.next().value){
      tokens.push(token)
    }
    ctx.reset();
    return tokens;
  }

  let parse_statement = function(tokens, pos){
    let binary = ['.','+','-','/','*','%','<','>','&','|','^','&&','||','~','<<','>>','>>>'];
    let unary = ['++', '--'];
    let statement = [];

    let token, prev_token;
    let line, prev_line;
    for (let i = pos; i < tokens.length; i++) {
      token = tokens[i];
      
      line = token.lineNumber();

      if (line !== prev_line && 
          prev_line !== void 0 &&
         !token.isDelimiter() && 
          binary.indexOf(token.val()) === -1 && 
          binary.indexOf(prev_token.val()) === -1 && 
          unary.indexOf(prev_token.val()) === -1){
              break;
      }
      
      prev_line  = line;
      prev_token = token;
      statement.push(token);
      
      if(token.val() === ';') break;
    }
    return statement;
  } // end parse_statement()

  // returns all tokens to the end of the file or block, whichever comes first
  let parse_statements = function(tokens) {
    let statements = [];
    for (let i=0; i < tokens.length; ) {
      let statement = parse_statement(tokens, i);
      statements.push(statements);
      i += statement.length;
    }
    return statements;
  }

  let consume_tokens = function(ctx, tokens){
    let token;
    for (var i = 0; i < tokens.length; i++) {
      if(!ctx.next()) {
        break;
      }
    }
  }

  let get_indices = function(tokens, indices, indices_to_arrays) {

    let subtokens = [];
    let last_indexible = [];

    for (var i = 0; i < tokens.length; i++) {
      let token = tokens[i];

      if (token.isDelimiter()){
        subtokens = tokenize(token.inner());
        get_indices(subtokens, indices, indices_to_arrays);
      }

      // check for tensor index within []
      if (isTensorIndex(token, subtokens)){
          let index = subtokens[0];
          indices[index.val()] = index;
          indices_to_arrays[index.val()] = last_indexible.slice(0);
      }

      // compile a list of array values formed over multiple tokens,
      //  e.g. this.foo[i].getBar()[j]
      if (isIndexible(token)) {
          last_indexible.push(token);
      } else {
          last_indexible = [];
      }
    }
  }



  return function (ctx) {
    let indices = {};
    let indices_to_arrays = {};

    let tokens = tokenize(ctx);
    let consumed;
    if(tokens[0].isBraces()){
      consumed = [tokens[0]];
      tokens = tokenize(tokens[0].inner());
    } else {
      tokens = parse_statement( tokens, 0 );
      consumed = tokens;
    }

    consume_tokens(ctx, consumed);

    get_indices(tokens, indices, indices_to_arrays);

    let statement = #``;
    for (let token of tokens){
      statement = #`${statement} ${token}`;
    }
    let loop = statement;
    for (let index_str of Object.keys(indices)){
      let index = indices[index_str];
      let length = length_lookup[index_str];
      let array = indices_to_arrays[index_str];
      loop = #`for(var ${index}=0, ${length}=${array}.length; ${index} < ${length}; ${index}++) { ${loop} }`;
    }
    
    return loop;
    // return #`boo`;
  }
})();
