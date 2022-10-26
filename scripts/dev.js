const path = require('path')
const {build} = require('esbuild') 

// 解析用户传入参数
const args = require('minimist')(process.argv.slice(2)) // 解析命令行参数
const target = args._[0] // 模块名
const format = args.f // 打包格式
// console.log('args', args)
// args { _: [ 'reactivity' ], f: 'esm' }

// 读取package信息
const pkg = require(path.resolve(__dirname, `../packages/${target}/package.json`))

// 获取模块类型
const outputFormat = format.startsWith('global') ? 'iife' : format === 'cjs' ? 'cjs' : 'esm'

// reactivity.global.js  reactivity.esm.js  reactivity.cjs.js
const outfile = path.resolve(__dirname, `../packages/${target}/dist/${target}.${format}.js`)

build({
    entryPoints: [path.resolve(__dirname, `../packages/${target}/src/index.ts`)],
    outfile,
    bundle: true,
    sourcemap: true,
    format: outputFormat,
    globalName: pkg.buildOptions?.name,
    platform: format === 'cjs' ? 'node' : 'browser',
    watch: { // 监控文件变化
        onRebuild(error) {
            if (!error) console.log(`rebuilt~~~~`)
        }
    }
}).then(() => {
    console.log('watching~~~')
})