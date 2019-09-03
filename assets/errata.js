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

// defs of global variables
let data_config; // from site_config
let data_issues = {}; // acquired errata issue listfrom api
let data_count = {}; // count of errata
const def_search = "/issues?state=open&labels=";

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
    content += '<li><span class="tocnumber">' + insert_id + '.1. </span><a href="#id_' + insert_id + '.1">Editorial Errata</a> <span id="number_editorial_' + label + '"></span></li>';
    content += '<li><span class="tocnumber">' + insert_id + '.2. </span><a href="#id_' + insert_id + '.2">Substantial Errata</a> <span id="number_substantial_' + label + '"></span></li>';
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
  content += '<li><span class="tocnumber">' + insert_id + '.1. </span><a href="#id_' + insert_id + '.1">Editorial Errata</a> <span id="number_editorial_others"></span></li>';
  content += '<li><span class="tocnumber">' + insert_id + '.2. </span><a href="#id_' + insert_id + '.2">Substantial Errata</a> <span id="number_substantial_others"></span></li>';
  content += '</ul></li>';
  insert_toc.innerHTML += content;
}

// find matching target rec document label from labels in repo
// repo = repo name, labels = /issue/XXX?labels
function findTargetLabel(repo, labels) {
  if (! data_config[repo]) {return ''; }
  if (labels.length < 1) {return ''; }
  var match_label = '';
  labels.forEach(function(item) {
    data_config[repo].recs.forEach(function(repo_label) {
      if (repo_label.name == item.name) {match_label = item.name; }
    });
  });
  return match_label;
}

function setViewWg(repo) {
  document.querySelector('#content_description').style.display = 'none';
  document.querySelector('#content_errata').style.display = 'block';
  if (data_config[repo]) {
    displayListRecs(data_config[repo].recs);
    document.getElementById('wgfullname').innerText = data_config[repo].wgname;
    var e_label = "Errata";
    if (data_config[repo].label) {e_label = data_config[repo].label; }
    getIssuesPerRepo(repo, e_label);
  } else {
    throw Error('Defined target configuration not found: ' + repo);
  }
}

function setListRepo(config) {
  document.getElementById('repolist').innerHTML = '';
  Object.keys(config).forEach(function(key) {
    var li_insert = 'repolist';
    var li_disp = config[key].wgname;
    if ('specname' in config[key]) {
      li_insert = config[key].wgname.replace(/ /g, '_');
      li_disp = config[key].specname;
      if (! document.getElementById(li_insert)) {
        document.getElementById('repolist').insertAdjacentHTML('beforeend',
          '<li>' + config[key].wgname + '<ul id="' + li_insert + '"></ul></li>');
      }
    }
    var liid = key.replace(/\//g, '_');
    document.getElementById(li_insert).insertAdjacentHTML('beforeend', 
      '<li><a href="#" id="' + liid + '">' + li_disp + '</a></li>');
    document.getElementById(liid).addEventListener('click', function(event) {
      setViewWg(this); }.bind(key));
  });
}

window.addEventListener('load', function(event) {
  // list click event handlers
  document.getElementById('repolist_help').addEventListener('click', 
    function(event) {
      document.querySelector('#content_description').style.display = 'block';
      document.querySelector('#content_errata').style.display = 'none';
    });
  // load config and publish items
  fetch(site_config, {
    cache: 'no-cache', method: 'GET', redirect: 'follow' })
  .then(function(response) {
    if (response.ok) {return response.json(); }
    throw Error('Returned response for config' + response.status);
  }).then(function(json) {
    data_config = json;
    setListRepo(data_config);
  }).catch(function(error) {
    console.log('Error found on loading configuration: ' + site_config + ' / ' + error.message);
  });
});

var convert_md = async function(repo, target_id, body_text) {
  fetch(github_api_markdown, {
    body: JSON.stringify({
      "text": body_text, "mode": "gfm", "context": repo
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

function getIssuesPerRepo(name, e_label) {
  var url_api = github_api_head + name + def_search + e_label;
  data_count = {};
  // quick hack initialization
  document.getElementById('number').innerText = '0';
  document.getElementById('date').innerText = 'N/A';
  var gh_e_url = 'https://github.com/' + name + '/labels/' + e_label;
  document.getElementById('errata_link').innerHTML = '<a href="' + gh_e_url + '">' + gh_e_url + '</a>';
  fetch(url_api)
  .then(function(response) {
    if (response.ok) {return response.json(); }
    throw Error('Errata issue list failed on ' + name + ' / ' + response.status);
  }).then(function(issues) {
    data_issues[name] = {};
    data_issues[name].size = issues.length;
    var cuat;
    issues.forEach(function(item) {
      cuat = new Date(item.updated_at);
      if (! data_issues[name].latest_change) {
        data_issues[name].latest_change = cuat;
      } else if (data_issues[name].latest_change < cuat) {
        data_issues[name].latest_change = cuat;
      }
      fetch(switchApiHead(item.comments_url))
      .then(function(response) {
        if (response.ok) {return response.json(); }
        throw Error('Errata comment failed on ' + item.comments_url + ' / ' + response.status);
      }).then(function(comments) {
        render_issue(name, item, comments);
      }).catch(function(error) {
        console.log('Error on loading comment for: ' + error.message);
      });
    });
    document.getElementById('number').innerText = data_issues[name].size;
    document.getElementById('date').innerText = data_issues[name].latest_change.toDateString();
  }).catch(function(error) {
    console.log('Error found on loading errata: ' + error.message);
  });
};

// render single issue, issue = /issues/XXX, comments = /issues/XXX/comments
// handling around to_disp is not reuiqred, proxy query option issue fixed
function render_issue(name, issue, comments) {
  var target = findTargetLabel(name, issue.labels).replace(/ /g, '_');
  if (target == '') {target = 'others'; }
  var category = 'substantial_';
  var labels = [];
//  var to_disp = false;
  issue.labels.forEach(function(label) {
    if (label.name.toLowerCase() == 'editorial') {category = 'editorial_'; }
//    if (label.name == 'Errata') {to_disp = true; }
    labels.push(label.name);
  });
  issue.label_list = labels.join(', ');
//  if (! to_disp) {return; }
  var output = issueToHtml(name, issue, comments);
  if (! data_count['number_' + category + target]) {
    data_count['number_' + category + target] = 0;
  }
  data_count['number_' + category + target] += 1;
  document.getElementById(category + target).innerHTML += output;
  // not so harmful for performance...
  Object.keys(data_count).forEach(function(key) {
    document.getElementById(key).innerText = '(' + data_count[key] + ')';
  });
};

// build html from issue data
function issueToHtml(repo, issue, comments) {
  // check summary exists
  var summary = undefined;
  comments.forEach(function(comment) {
    if (comment.body.search('^Summary:') !== -1) {summary = comment; }
  });
  // construct display
  var result = '';
  result += '<div class="issue">';
  result += '<h3>"' + issue.title + '"</h3>';
  result += '<p>';
  result += '<span class="what">Issue number:</span> <a href="' + issue.html_url + '">#' + issue.number + '</a><br>';
  result += '<span class="what">Raised by:</span> <a href="' + issue.user.url + '">@' + issue.user.login + '</a><br>';
  result += '<span class="what">Extra Labels:</span> ' + issue.label_list + '</a><br>';
  result += '</p>';
  result += '<p><span class="what"><a href="' + issue.html_url + '">Initial description:</a></span></p><div id="issue_body_' + issue.number + '"></div>';
  convert_md(repo, 'issue_body_' + issue.number, issue.body);
  if (summary !== undefined) {
    result += '<p><span class="what"><a href="' + summary.html_url + '">Erratum summary:</a></span></p><div id="issue_summary_' + issue.number + '"></div>';
    convert_md(repo, 'issue_summary_' + issue.number, 
      summary.body.substr("Summary:".length));
  }
  result += '</div>';
  return result;
}


