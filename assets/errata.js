/*
Script to create errata report pages based on github issues used to raise an errata.

The workflow on github is as follows:

- An issue is raised. Additionally, a label is added to designate a specific label defined by for the
repository (typically a reference to a specific document). A specific label may be assigned by the specific group for the repo to
differentiate the raised errata from the other issues.
- The community discusses the issue. If it is accepted as a genuine erratum, the label "Errata" is added to the entry. Additionally,
a new comment on the issue may be added beginning with the word "Summary".
- If the community rejects the issue as an erratum, the issue is closed.

As for the report, the structure of the HTML file can be seen in the index.html file. The net result is
that the active issues are displayed in different sections, depending on the presence of specific labels. The relevant values are set
through some data-* attributes on the elements.
*/

// site wide constant values
const site_config = "config.json";

// to use api cache, set equivallent as 'https://api.github.com/repos/'
const github_api_head = 'https://ch03.himor.in/w3c/github-cache/';
const github_api_orig = 'https://api.github.com/repos/';
// to use api cache for markdown converter, set full url (temporary before building integrated cache
//const github_api_markdown = 'https://api.github.com/markdown';
const github_api_markdown = 'https://ch03.himor.in/w3c/github-cache/w3c/markdown';

// temporary
const target_repo = "w3c/cswv";

// defs of global variables
let data_config; // from site_config
let data_issues = {}; // acquired errata issue listfrom api
const def_search_errata = "/issues?state=open&labels=Errata";

// convert from 'https://api.github.com/repos/' to github_api_head
// better to be performed by integrated cache server
function switchApiHead(url) {
    return url.replace(github_api_orig, github_api_head);
}

// construct display from config
function displayListRecs (config) {
  var insert_sections = document.getElementById('rec_sections');
  var insert_toc = document.getElementById('toc_ul');
  insert_sections.innerHTML = '';
  insert_toc.innerHTML = '';
  var insert_id = 0;
  config.forEach(function(item) {
    insert_id += 1;
    var content;
    var label = item.name.replace(/ /g, '_');
    // main
    content = '';
    content += '<section id="section_' + label + '">';
    content += '<h1 class="headertoclevel1"><span id="id_' + insert_id + '">' + insert_id + '. </span>Open Errata on the "' + (item.full ? item.full : item.name) + '" Recommendation</h1>';
    content += '<dl>';
    content += '<dt>Latest Published Version:</dt><dd><a href="' + item.rec + '">' + item.rec + '</a></dd>';
    content += '<dt>Editor’s draft:</dt><dd><a href="' + item.draft + '">' + item.draft + '</a></dd>';
    content += '<dt>Latest Publication Date:</dt><dd>' + item.latest + '</dd>';
    content += '</dl>';
    content += '<section id="editorial_' + label + '"><h2 class="headertoclevel2"><span id="id_' + insert_id + '.1">' + insert_id + '.1 </span>Editorial Errata</h2></section>';
    content += '<section id="substantial_' + label + '"><h2 class="headertoclevel2"><span id="id_' + insert_id + '.2">' + insert_id + '.2 </span>Substantial Errata</h2></section>';
    content += '</section>';
    insert_sections.innerHTML += content;
    // toc
    content = '';
    content += '<li>';
    content += '<span class="tocnumber tocvisible">' + insert_id + '. </span><a href="#id_' + insert_id + '">Open Errata on the "' + (item.full ? item.full : item.name) + '" Recommendation</a>';
    content += '<ul class="toc toclevel2">';
    content += '<li><span class="tocnumber">' + insert_id + '.1. </span><a href="#id_' + insert_id + '.1">Editorial Errata</a></li>';
    content += '<li><span class="tocnumber">' + insert_id + '.2. </span><a href="#id_' + insert_id + '.2">Substantial Errata</a></li>';
    content += '</ul></li>';
    insert_toc.innerHTML += content;
  });
  // add others
  var content;
  var label = 'others';
  insert_id += 1;
  // main
  content = '';
  content += '<section id="section_others">';
  content += '<h1 class="headertoclevel1"><span id="id_' + insert_id + '">' + insert_id + '. </span>Other Errata, Not Assigned to a Specific Document</h1>';
  content += '<section id="editorial_' + label + '"><h2 class="headertoclevel2"><span id="id_' + insert_id + '.1">' + insert_id + '.1 </span>Editorial Errata</h2></section>';
  content += '<section id="substantial_' + label + '"><h2 class="headertoclevel2"><span id="id_' + insert_id + '.2">' + insert_id + '.2 </span>Substantial Errata</h2></section>';
  content += '</section>';
  insert_sections.innerHTML += content;
  // toc
  content = '';
  content += '<li>';
  content += '<span class="tocnumber tocvisible">' + insert_id + '. </span><a href="#id_' + insert_id + '">Open Errata, Not Assigned to a Specific Document</a>';
  content += '<ul class="toc toclevel2">';
  content += '<li><span class="tocnumber">' + insert_id + '.1. </span><a href="#id_' + insert_id + '.1">Editorial Errata</a></li>';
  content += '<li><span class="tocnumber">' + insert_id + '.2. </span><a href="#id_' + insert_id + '.2">Substantial Errata</a></li>';
  content += '</ul></li>';
  insert_toc.innerHTML += content;
}

window.addEventListener('load', function(event) {
  fetch(site_config, {
    cache: 'no-cache', method: 'GET', redirect: 'follow' })
  .then(function(response) {
    if (response.ok) {return response.json(); }
    throw Error('Returned response for config' + response.status);
  }).then(function(json) {
    data_config = json;
    if (data_config[target_repo]) {
      displayListRecs(data_config[target_repo]);
    } else {
      throw Error('Defined target configuration not found: ' + target_repo);
    }
  }).catch(function(error) {
    console.log('Error found on loading configuration: ' + site_config + ' / ' + error.message);
  });
});

var convert_md = async function(target_id, body_text) {
  fetch(github_api_markdown, {
    body: JSON.stringify({
      "text": body_text, "mode": "gfm", "context": dataset.githubrepo
    }),
    headers: new Headers({
      'Content-Type': 'application/json'
    }),
    cache: 'no-cache', 
    method: 'POST', redirect: 'follow' })
  .then(function(response) {
    if (response.ok) {return response.text(); }
  }).then(function(res_text) {
    document.getElementById(target_id).innerHTML = res_text;
  }).catch(function(error) {
    document.getElementById(target_id).innerHTML = '<pre>' + body_text + '</pre>';
    console.log(error);
  });
};

function getIssuesPerRepo(name) {
  var url_api = github_api_head + name + def_search_errata;
  fetch(url_api)
  .then(function(response) {
    if (response.ok) {return response.json(); }
    throw Error('Errata issue list failed on ' + name + ' / ' + response.status);
  }).then(function(issues) {
    data_issues[name] = {};
    if (issues.lengt > 0) {
      data_issues[name].latest_change = moment.max(_.map(issues, function(item) { return moment(item.updated_at) }));
      document.getElementById('date').innerText = data_issues[name].latest_change.format('dddd, MMMM Do YYYY');
    } else {
      document.getElementById('date').innerText = 'N/A';
    }
    document.getElementById('number').innerText = issues.length;
    document.getElementById('errata_link').innerHTML = '<a href="https://github.com/"' + name + '/labels/Errata">https://github.com/' + name + '/labels/Errata</a>';
    issues.forEach(function(item) {
      fetch(switchApiHead(item.comments_url))
      .then(function(response) {
        if (response.ok) {return response.json(); }
        throw Error('Errata comment failed on ' + item.comments_url + ' / ' + response.status);
      }).then(function(comments) {
        render_issue(item, comments);
      }).catch(function(error) {
        console.log('Error on loading comment for: ' + error.message);
      });
    });
  }).catch(function(error) {
    console.log('Error found on loading errata: ' + error.message);
  });
};

function render_issue(issue, comments) {
};

/*
$(document).ready(function() {
    // convert markdown format text to html via markdown API
    var display_issue = function(node, issue, comments, labels) {
        var  display_labels = _.reduce(labels, function(memo, label, index) {
            if( label === "Errata" )
                return memo
            else if( memo === "" )
                return label
            else
                return memo + ", " + label
        }, "");
        var div = $("<div class='issue'></div>");
        node.append(div);
        div.append("<h3>\"" + issue.title + "\"</h3>");
        div.append("<p><span class='what'>Issue number:</span> <a href='" + issue.html_url + "'>#" + issue.number + "</a><br>" +
                   "<span class='what'>Raised by:</span><a href='" + issue.user.url + "'>@" + issue.user.login + "</a><br>"    +
                   "<span class='what'>Extra Labels:</span> " + display_labels + "</a><br>"                                    +
                   "</p>");
        div.append("<p><span class='what'><a href='" + issue.html_url + "'>Initial description:</a></span></p><div id='issue_body_" + issue.number + "'></div>");
        convert_md('issue_body_' + issue.number, issue.body);

        // See if a summary has been added to the comment.
        var summary = undefined;
        _.each(comments, function(comment) {
            if( comment.body.search("^Summary:") !== -1 ) {
                summary = comment;
            }
        })

        if( summary !== undefined ) {
            div.append("<p><span class='what'><a href='" + summary.html_url + "'>Erratum summary:</a></span></p><div id='issue_summary_" + issue.number + "'></div>");
            convert_md('issue_summary_' + issue.number, 
                summary.body.substr("Summary:".length));
        }
    }

    var render_issue = function(issue, comments) {
        var labels = _.map(issue.labels, function (obj) {
            return obj.name;
        });
        var displayed = false;
        $("main > section").each(function(index) {
            var dataset = $(this).prop('dataset');
            if( _.include(labels, dataset.erratalabel) ) {
                if( _.include(labels, "Editorial") ) {
                    subsect = $(this).children("section:first-of-type")
                } else {
                    subsect = $(this).children("section:last-of-type")
                }
                display_issue(subsect, issue, comments, labels)
                displayed = true;
            }
        });
        if( displayed === false ) {
            $("main > section").each(function(index) {
                var dataset = $(this).prop('dataset');
                if( dataset.nolabel !== undefined ) {
                    if( _.include(labels, "Editorial") ) {
                        subsect = $(this).children("section:first-of-type")
                    } else {
                        subsect = $(this).children("section:last-of-type")
                    }
                    display_issue(subsect, issue, comments, labels)
                }
            });
        }
    }

});
*/

