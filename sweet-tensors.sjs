syntax tensor = function (ctx) {
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

  let parse = function(ctx, indices, indices_to_arrays, global){
    global = global || false;

    let token;
    let tokens = [];
    let subtokens = [];
    let last_indexible = [];

    while(token = ctx.next().value){
        // compile a list of tokens within this syntax level
        tokens.push(token);

        // recursively process tokens within [], (), or {}
        if (token.isDelimiter()){
            subtokens = parse(token.inner(), indices, indices_to_arrays);
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
        
        // break if we are not inside a delimiter and 
        //  we've reached the end of the statement
        // currently, ';' is the only way we can detect this - 
        //  undefined behavior results when statements are not semicolon delimited.
        if(token.val() === ';' && global){
            break;
        }
    }
    return tokens;
  } // end parse()

  let indices = {};
  let indices_to_arrays = {};
  let tokens = parse(ctx, indices, indices_to_arrays, true);
  if(tokens.length === 1 && tokens[0].isBraces()){
    tokens = parse(tokens[0].inner(), indices, indices_to_arrays);
  }
  
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
}

