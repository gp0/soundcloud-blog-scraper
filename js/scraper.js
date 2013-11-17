
function addScrapedLinksToJD() {
  urls = $("#scraped").val();
  $.post( "http://127.0.0.1:9666/flash/add", { urls: urls});
}

function getSoundCloudBaseURL (url) {
  secret_token = $.url(url).param("secret_token");

  baseUrl = url.replace($.url(url).attr("query"), '');
  return baseUrl;
}

function scrape(url) {
  

  var scUrl;
  var scrapedRows = 0;


  var links = [];
  var download_urls = [];

    //deferred objects
    var jxhr = [];
    
    const client_id = "1065ad97c0ec0da0ad890fbf859ecaff";
    
    $("#spinner").toggle();

    //using anyorigin.com so we can get around same-origin policy
    $.getJSON('http://anyorigin.com/get?url='+url+'+&callback=?',  function( data ) {
     $($.parseHTML(data.contents)).each(function() {
      $(this).find("iframe[src*=soundcloud]").each(function() {
        scUrl = $(this).attr("src");
        scUrl = $.url(scUrl).param("url");
        
        links.push(scUrl);
        scrapedRows++;
      }); 
    }); 


     var tracklistJxhr = [];
     var soundcloudAPILinks = [];

     $.each(links, function(index, value) {


      if (value.indexOf("playlists") != -1) {
        tracklistJxhr.push(
          $.getJSON( getSoundCloudBaseURL(value)+".json", {client_id : client_id, secret_token : $.url(value).param("secret_token")}, function( listdata ) {
            $.each(listdata.tracks, function (index, track) {
              soundcloudAPILinks.push(track.uri);
            });
          }).error(function() { })
          );
      } else {
        soundcloudAPILinks.push(value);
      }
      
    });

     $.when.apply($, tracklistJxhr).done(function() {
      $.each(soundcloudAPILinks, function(index, value) {

        jxhr.push(
          $.getJSON( getSoundCloudBaseURL(value)+".json", {client_id: client_id, secret_token: $.url(value).param("secret_token")}, function( scJson ) {
            if (scJson.downloadable == true) {

              download_urls.push(scJson.download_url+"&client_id="+client_id);
              
            //fallback to stream url
          } else {
            download_urls.push(scJson.stream_url);
          }
          
          
        })
          );
        
      });

      $.when.apply($, jxhr).done(function() {
        $.each(download_urls, function(index, value) {
          $("#scraped").append(value+"\r\n");
        });
      });

    });
     
     $("#scraped").attr("rows", scrapedRows);
     $("#scraped").toggle("fast"); 
     $("#jd").toggle("fast"); 
     $("#scraped").select();
     $("#spinner").toggle();

   });
}
