import { shape, clearShapes } from "./map.js";

function check(ths, cls) {
    const cbxs = document.getElementsByClassName(cls);
    let setTo = false ;
    if (ths.checked) {
        setTo = true;
    }
    for (var i = 0; i < cbxs.length; i++) {
        cbxs[i].checked = setTo;
    }
}

async function spql(url, query) {
    console.log('querying ' + url)
    let url2 = new URL(url)
    url2.searchParams.append("query", query)
    let options = {
        headers: {
            'Content-Type': 'application/sparql-results+json',
        },
    }

    let response = await fetch(url2, options)

    if (response.ok) {
        return await response.json()
    } else {
        alert("HTTP-Error: " + response.status)
    }
}

function get_endpoint() {
    let v = document.getElementById('endpoint').value
    if (!v) {
        alert('Please enter an API endpoint')
        return null
    } else {
        return v.endsWith('/') ? v = v + 'sparql' : v = v + '/sparql'
    }
}

function make_query_restrictions() {
    let dataset_restrictions = []
    const cbxs = document.querySelectorAll('.restriction-dataset')
    for (var i = 0; i < cbxs.length; i++) {
        if (cbxs[i].checked) {
            dataset_restrictions.push(`<${cbxs[i].id}> rdfs:member/rdfs:member ?f .`)
        }
    }

    let fc_restrictions = []
    const cbxs2 = document.querySelectorAll('.restriction-fc')
    for (var i = 0; i < cbxs2.length; i++) {
        if (cbxs2[i].checked) {
            fc_restrictions.push(`<${cbxs2[i].id}> rdfs:member ?f .`)
        }
    }

    let ds = '{ ' + dataset_restrictions.join('}\n    UNION\n    {') + ' }'
    let fc = '    { ' + fc_restrictions.join('}\n    UNION\n    {') + ' }'

    let all = ''
    if (ds) {
        all += ds
    }
    if (fc) {
        all += '\n\n' + fc
    }
    return all
}

export async function search() {
    document.getElementById('resultsList').style.display = 'none';
    if (!shape) {
        alert("You have not marked a point or a square on the map!")
    } else {
        let endpoint = 'http://asgs.linked.fsdf.org.au/sparql'

        let q =
`PREFIX geo: <http://www.opengis.net/ont/geosparql#>
PREFIX geof: <http://www.opengis.net/def/function/geosparql/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT ?c
WHERE {
    ?f a geo:Feature ;
       geo:hasGeometry/geo:asWKT ?wkt .

    ${make_query_restrictions()}

    FILTER (geof:sfWithin(?wkt, "${shape}"))
}`

        if (document.getElementById('queryOnly').checked) {
            document.getElementById('resultsList').innerHTML = q.replaceAll('<', '&lt;')
            document.getElementById('resultsList').style.display = 'block'
        } else {
            let r = await spql(endpoint, q)
            console.log(r)
            if (r['results']['bindings'].length > 0) {
                document.getElementById('resultsList').innerHTML = 'Check it!'
            } else {
                document.getElementById('resultsList').innerHTML = '<em>No results found!</em>'
            }
            document.getElementById('resultsList').style.display = 'block'
        }
    }
}

function reset() {
    clearShapes()
    const cbxs = document.querySelectorAll('.restriction-dataset, .restriction-fc');
    for (var i = 0; i < cbxs.length; i++) {
        cbxs[i].checked = false;
    }

    document.getElementById('queryOnly').checked = false

    document.getElementById('resultsList').style.display = 'none'
}

window.check = check
window.search = search
window.reset = reset