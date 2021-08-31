import fs = require('fs')
import path = require('path')

//import * as fs from 'fs'
//import * as path from 'path'

// segmentation
const STEADY_TOLERANCE = 2
const MIN_GESTURE_LEN = 20
const MAX_GESTURE_ACC = 5


// data format
const NUM_SAMPLES = 50;
const NUM_DIM = 3;
const IMAGE_CHANNELS = 1;

const RAND_ROT = 0.2;

type SMap<T> = {
    [x: string]: T;
}
function median(arr: number[]) {
    arr.sort((a, b) => a - b)
    return arr[arr.length >> 1]
}
function dist(a: number[], b: number[]) {
    let sum = 0
    if (a.length != b.length)
        throw new Error("wrong size")
    for (let i = 0; i < a.length; i++)
        sum += Math.abs(a[i] - b[i])
    return sum
}

function permute<T>(arr: T[]) {
    for (let i = 0; i < arr.length; ++i) {
        const a = randint(arr.length)
        const b = randint(arr.length)
        const tmp = arr[a]
        arr[a] = arr[b]
        arr[b] = tmp
    }
}

function pickRandom<T>(arr: T[]) {
    return arr[randint(arr.length)]
}

interface Range {
    id: number;
    preStart: number;
    start: number;
    stop: number;
    postStop: number;
}

function multiply(mat: number[][], vect: number[]) {
    const res: number[] = new Array(vect.length)
    for (let i = 0; i < vect.length; ++i) {
        res[i] = 0
        for (let j = 0; j < vect.length; ++j) {
            res[i] += mat[i][j] * vect[j]
        }
    }
    return res
}

function rotate(a: number, b: number, c: number, samples: number[][]) {
    const sa = Math.sin(a)
    const ca = Math.cos(a)
    const sb = Math.sin(b)
    const cb = Math.cos(b)
    const sg = Math.sin(c)
    const cg = Math.cos(c)
    const rotmat = [
        [ca * cb, ca * sb * sg - sa * cg, ca * sb * cg + sa * sg],
        [sa * cb, sa * sb * sg + ca * cg, sa * sb * cg - ca * sg],
        [-sb, cb * sg, cb * cg]
    ]
    return samples.map(s => multiply(rotmat, s))
}

function rand(max: number) {
    // TODO: use something else?
    return Math.random() * max
}

function randSymmetric(max: number) {
    return rand(max * 2) - max
}

function randint(max: number) {
    return rand(max) | 0
}

function vectlen(s: number[]) {
    return Math.sqrt(s[0] * s[0] + s[1] * s[1] + s[2] * s[2])
}

function vectmul(s: number[], m: number) {
    return s.map(v => v * m)
}

function toCSV(data: number[][]) {
    let r = ""
    for (const line of data) {
        r += line.map(v => v.toString()).join(",") + "\n"
    }
    return r
}

function parseCSV(src: string) {
    const data: number[][] = []
    let header: string[]

    for (const line of src.split(/\r?\n/)) {
        const words = line.split(/,/)
        if (header == null)
            header = words
        else
            data.push(words.map(s => parseFloat(s)))
    }

    return { header, data }
}

class DataProvider {
    private samples: number[][]
    ranges: Range[]

    constructor(public csvurl: string, private id: number = null) {
    }


    get className() {
        if (this.id == null)
            return "???"
        return classNames[this.id]
    }

    private noiseRanges() {
        const sampleLen = NUM_SAMPLES
        const len = sampleLen + (sampleLen >> 1)
        const midlen = sampleLen >> 1
        this.ranges = []
        for (let off = 0; off + len < this.samples.length; off += len) {
            this.ranges.push({
                id: this.id,
                preStart: off,
                start: off + (len - midlen >> 1),
                stop: off + (len + midlen >> 1),
                postStop: off + len,
            })
        }
        //console.log("noise", this.ranges)
    }

    async load() {
        console.log("loading " + this.csvurl)
        const parsedCSV = parseCSV(fs.readFileSync(this.csvurl, "utf8"))

        const buckets: SMap<number[][]> = {}
        const allsamples: number[][] = []
        this.samples = []

        for (const obj of parsedCSV.data) {
            const vals = obj.slice(1)
            const bucketId = vals.map(v => Math.round(v * 5)).join(",")
            if (!buckets[bucketId])
                buckets[bucketId] = []
            buckets[bucketId].push(vals)
            allsamples.push(vals)
            this.samples.push(vals.slice(0))
        }

        if (/noise/.test(this.csvurl)) {
            this.noiseRanges()
            return
        }
        const bids = Object.keys(buckets)
        bids.sort((a, b) => buckets[b].length - buckets[a].length)
        const topnum = buckets[bids[0]].length
        const avgbuckets = bids.slice(0, 6).map(bid => buckets[bid]).filter(x => x.length > (topnum / 10))
        const avgsamples: number[][] = []
        avgbuckets.forEach(a => a.forEach(b => avgsamples.push(b)))
        const med = [0, 1, 2].map(idx => median(avgsamples.map(a => a[idx])))
        console.log("steady:", med)
        const distances = allsamples.map(s => dist(med, s))
        const meddist = median(distances)
        const cutoff = meddist * STEADY_TOLERANCE
        console.log("cutoff:", cutoff, "in cutoff %:", distances.filter(d => d < cutoff).length * 100 / distances.length)

        let acc = 0
        let lastbeg = -1
        let idx = 0
        let prevEnd = 0
        this.ranges = []
        for (const sample of allsamples) {
            const d = dist(med, sample)
            sample.push(d > cutoff ? -1 : -2)
            if (d > cutoff) {
                acc++
                if (lastbeg == -1)
                    lastbeg = idx
            } else {
                if (acc) {
                    acc--
                    if (!acc && lastbeg != -1) {
                        const len = idx - lastbeg
                        if (len > MIN_GESTURE_LEN) {
                            for (let i = lastbeg - 3; i <= idx; ++i)
                                allsamples[i][3] += 3
                            this.ranges.push({
                                id: this.id,
                                preStart: prevEnd,
                                start: Math.max(lastbeg - 3, 0),
                                stop: idx,
                                postStop: -1
                            })
                        }
                        lastbeg = -1
                    }
                }
            }
            acc = Math.min(MAX_GESTURE_ACC, acc)
            idx++
        }

        for (let i = 1; i < this.ranges.length; ++i) {
            this.ranges[i - 1].postStop = this.ranges[i].start - 1
        }
        this.ranges[this.ranges.length - 1].postStop = allsamples.length - 1
        // console.log(this.ranges)
    }

    append(other: DataProvider) {
        let off = 0
        if (!this.samples || !this.samples.length)
            this.samples = other.samples
        else {
            off = this.samples.length
            for (const s of other.samples)
                this.samples.push(s)
        }
        if (!this.ranges) this.ranges = []
        for (const r of other.ranges) {
            this.ranges.push({
                id: r.id,
                preStart: r.preStart + off,
                start: r.start + off,
                stop: r.stop + off,
                postStop: r.postStop + off,
            })
        }
    }

    private copy(other: DataProvider) {
        this.samples = other.samples
    }

    split(firstFrac: number): [DataProvider, DataProvider] {
        const cutoff = Math.round(firstFrac * this.ranges.length)
        const r0 = new DataProvider(this.csvurl, this.id)
        r0.copy(this)
        r0.ranges = this.ranges.slice(0, cutoff)
        const r1 = new DataProvider(this.csvurl, this.id)
        r1.copy(this)
        r1.ranges = this.ranges.slice(cutoff)
        return [r0, r1]
    }


    filterRanges() {
        const l0 = this.ranges.length
        this.ranges = this.ranges.filter(r => r.stop - r.start < NUM_SAMPLES - 2)
        const l1 = this.ranges.length
        let drop = l0 - l1
        if (drop)
            console.log(this.csvurl, `drop ${drop} too long`)
        this.ranges = this.ranges.filter(r => r.postStop - r.preStart > NUM_SAMPLES + 2)
        const l2 = this.ranges.length
        drop = l1 - l2
        if (drop)
            console.log(this.csvurl, `drop ${drop} with too little wiggle`)
        permute(this.ranges)
    }

    annotatedData() {
        const res: number[][] = []
        for (let i = 0; i < this.samples.length; ++i) {
            let best = 0
            for (const rng of this.ranges) {
                if (rng.start <= i && i <= rng.stop)
                    best = Math.max(best, 3)
                else if (rng.preStart <= i && i <= rng.postStop)
                    best = Math.max(best, 0.5)
            }
            res.push(this.samples[i].concat([best]))
        }
        return res
    }

    private flatRandom() {
        let vect = [randSymmetric(1), randSymmetric(1), randSymmetric(1)]
        const len = vectlen(vect)
        vect = vectmul(vect, 1 / len)
        const res: number[][] = []
        for (let i = 0; i < NUM_SAMPLES; ++i) {
            res.push(vect.map(v => v + randSymmetric(0.01)))
        }
        return res
    }

    private rangeSamples(r: Range) {
        if (r === null) return this.flatRandom()
        const len = r.start - r.preStart
        const off = r.preStart + randint(len)
        const res = this.samples.slice(off, off + NUM_SAMPLES)
        const rot = rotate(
            randSymmetric(RAND_ROT),
            randSymmetric(RAND_ROT),
            randSymmetric(RAND_ROT),
            res
        )
        return rot
    }

    private rangeLabels(rng: Range) {
        if (rng === null) rng = { id: 0 } as any
        return classNames.map((_, i) => rng.id == i ? 1 : 0)
    }

    getSample() {
        const rng = rand(1) < 0.8 ? pickRandom(this.ranges) : null
        const data = this.rangeSamples(rng)
        return {
            className: rng == null ? "noise" : classNames[rng.id],
            data
        }
    }
}

// find data -name \*.csv
const fileNames = `
data/michal/punch.csv
data/michal/right.csv
data/michal/left.csv
data/michal/noise.csv
data/michal/noise1.csv
data/ira/punch2.csv
data/ira/right1.csv
data/ira/left0.csv
data/ira/noise0.csv
`

const classNames = ['noise', 'punch', 'left', 'right'];


function mkdirP(thePath: string) {
    if (thePath == "." || !thePath) return;
    if (!fs.existsSync(thePath)) {
        mkdirP(path.dirname(thePath))
        fs.mkdirSync(thePath)
    }
}

async function run() {
    const datasets: DataProvider[] = []
    for (const fn of fileNames.split(/\n/).map(s => s.trim())) {
        if (!fn) continue
        const idx = classNames.findIndex(cl => fn.indexOf(cl) >= 0)
        const d = new DataProvider(fn, idx)
        datasets.push(d)
    }

    let lens: number[] = []
    for (const d of datasets) {
        await d.load()
        for (const r of d.ranges) {
            lens.push(r.stop - r.start)
        }
    }
    //console.log(lens)
    console.log("median len: " + median(lens))
    console.log("len 50+: " + lens.filter(l => l > NUM_SAMPLES).length)

    mkdirP("built/seg")
    for (const d of datasets) {
        d.filterRanges()
        if (d.className != "noise") {
            const pp = "built/seg/" + d.csvurl.replace(/\//g, "-")
            const csv = "x,y,z,rng\n" + toCSV(d.annotatedData())
            fs.writeFileSync(pp, csv)
        }
    }

    const trainData = new DataProvider("train")
    const testData = new DataProvider("test")
    const validateData = new DataProvider("validate")

    for (const d of datasets) {
        const [test0, train] = d.split(0.4)
        const [test, validate] = d.split(0.5)
        trainData.append(train)
        testData.append(test)
        validateData.append(validate)
        console.log(d.className, test.ranges.length, train.ranges.length, validate.ranges.length)
    }

    writeSet(trainData, 1000)
    writeSet(testData, 500)
    writeSet(validateData, 500)

    function writeSet(ds: DataProvider, num: number) {
        ds.filterRanges()
        const pp = "built/" + ds.csvurl
        mkdirP(pp)
        for (let i = 0; i < num; ++i) {
            const s = ds.getSample()
            const fn = pp + "/" + s.className + ("0000" + i).slice(-4) + ".csv"
            const csv = "x,y,z\n" + toCSV(s.data)
            fs.writeFileSync(fn, csv)
        }
        console.log("written to " + pp)
    }
}

if (require.main === module) run()
