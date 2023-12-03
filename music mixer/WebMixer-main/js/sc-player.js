// Soundcloud player script V1.0
{
    const SCAPI = "https://api.soundcloud.com";
    
    var SCPlayerPosition = [0,0];

    var settings = {color: "%23ff4400",
        single_active: false,
        hide_related: true,
        show_comments: false,
        buying: false,
        show_user: false,
        show_playcount: false,
        show_reposts: false,
        show_artwork: false,
        show_teaser: false
        };

    function SCPlayerCreate(id,trackURL,autoplay = false) {
        settings["auto_play"] = autoplay;       
        var ifrm = document.createElement("iframe");
        ifrm.setAttribute("src", createURL(trackURL,settings));
        ifrm.setAttribute("allow","autoplay");
        ifrm.setAttribute("frameborder","no");
        ifrm.setAttribute("id",`sc-player${id}`);
        ifrm.style.height = "140px";
        ifrm.style.width = "100%";
        deck[id].appendChild(ifrm);
        
        var widgetIframe = document.getElementById(`sc-player${id}`);
        control[id].widget = SC.Widget(widgetIframe);
        SCPlayerCreateEvents(id); 
    }

    function createURL(trackURL,props)
    {
      var result = `https://w.soundcloud.com/player/?url=${trackURL}`;
      Object.entries(props).forEach(entry => {
        const [key, value] = entry;
        result += `&${key}=${value}`;
      });
      return result;
    }
    
    function SCGetTrackURL(trackID,autoplay = false){
        if(trackID.startsWith("SC/")){
            trackID = trackID.replace("SC/","tracks/");
        }
        var target = `${SCAPI}/${trackID}`;
        settings["auto_play"] = autoplay;
        return [target, settings];
    }

    function SCgetPlaylist(widget,id){
        widget.getSounds(function(plist) {
            if(plist.length > 0){
                widget.getCurrentSoundIndex(function(index) {
                    playerInfo[id].innerText += ` ${index+1}/${plist.length}`;
                });
                console.log(plist);
            }
        });    
    }

    function SCextractTitle(bigURL){
        const regex = new RegExp("(title=\"((?:\\\\.|[^\"\\\\]){0,})\")", "g");
        var x, result = [];
        while ((x = regex.exec(bigURL))!= null) {
            if(x.length>1){
                result.push(htmlDecode(x[2]));
            }
        }
        if(result.length==1){
            result.push("");
        }
        return result;
    }

    function SCextractID(bigURL){
        var SCid = bigURL.match(/\/tracks\/[0-9]+/i);
        if(!SCid || SCid.length==0){
            SCid = bigURL.match(/\/users\/[0-9]+/i);
        }
        if(!SCid || SCid.length==0){
            return null;
        }
        SCid = SCid[0].substring(1).toLowerCase();
        return SCid.replace("tracks/","SC/");
    }
    
    function SCgetCurrentTitle(id,currentSound){
        const meta = currentSound.publisher_metadata;
        var data = {
            id: SCextractID(currentSound.uri),
            name: currentSound.title,
            artist: meta.artist ? meta.artist : "",
            genre: currentSound.genre ? currentSound.genre : "",
            coverArt: currentSound.artwork_url,
            duration: currentSound.duration
        };
        if(meta.release_title){
            data.name = meta.release_title;
        }
        updateTitle(data);
        extraInfo[id].innerText = data.genre;
    }

    function SCPlayerCreateEvents(id){    
        var widgetIframe = document.getElementById(`sc-player${id}`),
        widget = SC.Widget(widgetIframe);
        //only triggered once
        widget.bind(SC.Widget.Events.READY, function() {
        console.log(`ready player ${id}`);
        widget.bind(SC.Widget.Events.PLAY_PROGRESS, function(x){
        var pos = x.currentPosition;
        if(SCPlayerPosition[id] != pos){
            SCPlayerPosition[id]=pos;
            control[id].position = pos/1000;
        }
        });
        widget.bind(SC.Widget.Events.PAUSE, function() {
            control[id].playing = false;
        });    
        //BUG: this will be triggered after finished-event :-(
        widget.bind(SC.Widget.Events.PLAY, function() {
            control[id].playing = true; 
            widget.getCurrentSound(function(currentSound) {
                control[id].duration = currentSound.duration/1000;
                SCgetCurrentTitle(id,currentSound);         
            });
            if(control[id].url.startsWith("users/")){
                SCgetPlaylist(widget,id);
            }       
        });
        widget.bind(SC.Widget.Events.FINISH, function() {
            console.log(`finish player ${id}`);
            control[id].playing = false;
            control[id].finished = true;
            widget.pause();
            autoLoader(id);
        });
    });
    }

    function SCPlayerDestroy(id){
        var widgetIframe = document.getElementById(`sc-player${id}`),
            widget = SC.Widget(widgetIframe);
        if(widget){
            widget.unbind();
        }
        widgetIframe.parentElement.innerHTML = "";
    }
}