'use strict'

const PHASE_PTS = {
  group:   { exact:3,  winner:2, extra:1 },
  round32: { exact:4,  winner:2, extra:1 },
  round16: { exact:5,  winner:3, extra:1 },
  quarters:{ exact:6,  winner:3, extra:1 },
  semis:   { exact:7,  winner:4, extra:1 },
  third:   { exact:5,  winner:3, extra:1 },
  final:   { exact:10, winner:5, extra:1 },
}

function getWinner(h,a){ return +h>+a?'home':+h<+a?'away':'draw' }

function calcPoints(pred, result, phase){
  if(!result||pred.score_home==null||pred.score_away==null) return 0
  if(result.score_home==null||result.score_away==null) return 0
  const pts = PHASE_PTS[phase]||PHASE_PTS.group
  const exact = +pred.score_home===+result.score_home && +pred.score_away===+result.score_away
  const winnerOk = getWinner(pred.score_home,pred.score_away)===getWinner(result.score_home,result.score_away)
  let total = exact ? pts.exact : winnerOk ? pts.winner : 0
  return total
}

function calcExtraPoints(pred, result){
  if(!pred||!result) return 0
  const fields = ['yellow_cards','red_cards','penalties_count','goals_first_half','goals_second_half']
  let hit = fields.some(f => pred[f]!=null && result[f]!=null && +pred[f]===+result[f])
  if(!hit && pred.mvp_player && result.mvp_player)
    hit = pred.mvp_player.trim().toLowerCase()===result.mvp_player.trim().toLowerCase()
  return hit ? 1 : 0
}

module.exports = { calcPoints, calcExtraPoints, PHASE_PTS }
