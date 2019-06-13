module.exports.newMsg = (content, obs, title) => {
    let cont = []
    if (Array.isArray(content)) {
        content.forEach((c) => cont.push(c))
    } else cont.push(content)
    return { content: cont, obs: [obs], title }

}
module.exports.success = 'msgSuccess'
module.exports.warning = 'msgWarning'
module.exports.error = 'msgError'


// const a = (content, obs, title) => {
//     let cont = []
//     console.log(typeof content)
//     if (Array.isArray(content)) {
//         content.forEach((c) => cont.push(c))
//     } else cont.push(content)
//     return { content: cont, obs: [obs], title }
// }
// console.log(a(['blabla', 123]))