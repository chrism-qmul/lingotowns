import requests

def query(q):
    response = requests.get("http://dbpedia.org/sparql", params={'query':q}, headers={'Accept': "application/json"}).json()
    return [x.get('name').get('value') for x in response.get('results', []).get('bindings', [])]

def tidy_name(name):
    return name.split("(", 2)[0]

def build_query(placetype):
    return """
    select ?name where {{
    {{
    ?o gold:hypernym dbr:{placetype} ;
        rdfs:label ?name
    }} UNION {{
    ?o dbo:type dbr:{placetype} ;
        rdfs:label ?name
        }}
        FILTER (lang(?name) = 'en')
    }}
    """.format(placetype=placetype)

categories = {"Desert":["Beach", "Dune", "Desert"],
        "Lakes":["Lake", "Loch", "Pond", "Reservoir"],
        "Woods":["Forest", "Woodland"]}

if __name__ == "__main__":
    for category, types in categories.items():
        with open("namegen/data/{}.txt".format(category), "w+") as fh:
            results = set()
            for t in types:
                results |= set([tidy_name(r) for r in query(build_query(t))])
            for r in results:
                fh.write(r + "\n")
