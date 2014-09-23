function markerMap(options) {
        /**
         * This is main class object that will be
         * return as model at end
         * */
        var _this = {};

        /**
         * default selector is body
         * passing selector likle any id or class will be render map
         * in selected selector dom element
         * */
        _this._selector = 'body';
        if(options.selector){
            _this._selector = options.selector;
        }

        /**
         * Default marker data is null
         * data is array of objects which contains
         * marker details and information
         * */
        _this._data = null;
        if(options.data){
            _this._data = options.data;
        }

         /**
          *  here At current stage we set default topojson is but
          *  we need proper data to set default values
          *  passing topojson with map options will load map from selected topojson
          * */
        _this._topojsonurl = null;  
        if(options.topojsonurl){
            _this._topojsonurl = options.topojsonurl;
        }

        /**
         * Map height : default value is 600
         * */
        _this._height = 600;
        if(options.height){
            _this._height = options.height;
        }

        /**
         * Map width : default value is 960
         * */
        _this._width = 960;
        if(options.width){
            _this._width = options.width;
        }

       /**
        * Marker click listener callback
        *   In case of outer script need top listen marker click event
        *   than pass the callback funcation
        * */
       _this.markerClickCallback = null;
       if(options.markerClickCallback){
           _this.markerClickCallback = options.markerClickCallback;
       }

        _this.projection = d3.geo.albersUsa()
            .scale(1280)
            .translate([_this._width / 2, _this._height / 2]);

        // var projection   = d3.geo.albers()
        // .translate([width / 2, height / 2]);

        _this.path = d3.geo.path()
            .projection( _this.projection);

         /**
          * Click handler for areas on map
          * i.e. state, county
          * */
        _this.markerMapAreaClickHandler = function(d) {
          if (_this.active.node() === this) return _this.markerMapAreaResetHandler();
          _this.active.classed("active", false);
          _this.active = d3.select(this).classed("active", true);

          var bounds = _this.path.bounds(d),
              dx = bounds[1][0] - bounds[0][0],
              dy = bounds[1][1] - bounds[0][1],
              x = (bounds[0][0] + bounds[1][0]) / 2,
              y = (bounds[0][1] + bounds[1][1]) / 2,
              scale = .9 / Math.max(dx / _this._width, dy / _this._height),
              translate = [_this._width / 2 - scale * x, _this._height / 2 - scale * y];

          d3.selectAll('.markerMap').transition()
              .duration(750)
              .style("stroke-width", 1.5 / scale + "px")
              .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
        }

        /**
         * markerMapAreaResetHandler for reset area zoom
         * */
        _this.markerMapAreaResetHandler = function() {
          _this.active.classed("active", false);
          _this.active = d3.select(null);
          d3.selectAll('.markerMap').transition()
              .duration(750)
              .style("stroke-width", "1.5px")
              .attr("transform", "");
        }

        _this.svg = d3.select(_this._selector).append("svg")
            .attr("width", _this._width)
            .attr("height", _this._height);

        _this.svg.append("rect")
            .attr("class", "background")
            .style('fill','none')
            .style('pointer-events','all')
            .attr("width", _this._width)
            .attr("height", _this._height)
            .on("click", _this.markerMapAreaResetHandler);

        _this.informationBox = _this.svg.append("g")
                .attr("class", "informationBox")
                .style("opacity", 0)
                .attr("transform", function(d) {return "translate(" + [10,(_this._height - 50 )] + ")"; });

        _this.svg = _this.svg.append('g')
                .attr("class", "markerMap")

        _this.states = _this.svg.append("g")
                .attr("class", "states");

        _this.labels = _this.svg.append("g")
                .attr("class", "labels")

        _this.markers = _this.svg.append("g")
                .attr("class", "markers");

        _this.informationRect = _this.informationBox.append('rect')
            .style('fill','rgba(255, 255, 255,0.6)')
            .style('stroke','#666')
            .style('pointer-events','none')
            .attr("rx", 20)
            .attr("ry", 20)
            .attr("width", 100)
            .attr("height", 40);

        _this.informationText = _this.informationBox.append("text")
            .attr("x", 12)
            .attr("y", 25)
            .text("");    

        _this.active = d3.select(null);
        _this.isRendered = false;
        var _mapData = null;

        _this.render = function() {
            if (! this._data) return;

            if(! this.isRendered){
                d3.json(_this._topojsonurl,function(us){
                  _this.drawMap(us);
                  _mapData = us;
                  _this.isRendered = true;
                });
            }else{
                if(_mapData){
                    _this.updateTopojson(_mapData);    
                }
            }
            
        };

        _this.updateData = function(_newData) {
            var _oldMarker = _this.markers.selectAll("image");

            _oldMarker.transition()
                .duration(500)
                .attr('width', 0)
                .attr('height', 0)
                .remove();

            _this._data =_newData;

            var _marker = _this.markers
              .selectAll("image")
                .data(_newData);

            _marker.enter().append("image")
                .attr("transform", function(d) {return "translate(" + [_this.projection(d.location)[0],_this.projection(d.location)[1]] + ")"; })
                .attr("xlink:href","images/marker.png")
                .style('cursor',"pointer")
                .attr('width', 0)
                .attr('height', 0)
                .on("click", this.markerClickHandler);

            _marker.transition()
                .duration(500)
                .attr("transform", function(d) {return "translate(" + [_this.projection(d.location)[0],_this.projection(d.location)[1]] + ")"; })
                .attr('width', 20)
                .attr('height', 24);

                $('svg .markers image').tipsy({ 
                  gravity: 's', 
                  html: true, 
                  title: function() {
                    var d = this.__data__;
                    return ' '+d.name+""; 
                  }
                });
        };

        _this.drawMap = function(_json){

            this.states = this.states.selectAll("path")
              .data(topojson.feature(_json, _json.objects['usa.geo']).features);

            this.states.enter()
                .append("path")
              .attr("class", "feature")
              .style('fill','#ccc')
              .style('stroke',"#fff")
              .style('cursor',"pointer")
              .style('opacity',0)
              .attr("d",this.path)
              .on("mouseenter", this.markerMapAreaMouseEnterHandler)
              .on("mouseleave", this.markerMapAreaMouseOutHandler)
              .on("click", this.markerMapAreaClickHandler);

              _this.updateData(_this._data);

              this.updateTopojson(_json)
        }

        _this.updateTopojson = function(_json) {
            this.states.data(topojson.feature(_json, _json.objects['usa.geo']).features)
              .transition()
                .duration(750)
                .ease("linear")
                .style('opacity',1)
                .attr("d", this.path);
            this.states.exit().transition().duration(750).remove();
            
            // _this.labels.data(topojson.feature(_json, _json.objects['usa.geo']).features)
            //   .transition()
            //     .duration(750)
            //     .ease("linear")
            //     .style('opacity',1)
            //     .text(function(d){
            //         return d.properties.name;
            //     })
            //     .attr("transform", function(d) { return "translate(" + _this.path.centroid(d) + ")"; });
            //     _this.labels.exit().transition().duration(750).remove();
        };

        _this.markerMapAreaMouseEnterHandler = function(d){
          _this.informationText.text(""+d.properties.name);
          var _textLenght = _this.informationText.node().getComputedTextLength();
          _this.informationRect.attr("width", _textLenght + 30)
          _this.informationBox.style("opacity", 1);
          d3.select(_this._selector+" .informationBox")[0][0].parentNode.appendChild(d3.select(_this._selector+" .informationBox")[0][0]);

        }

        _this.markerMapAreaMouseOutHandler = function(d){
          _this.informationText.text("")
          _this.informationBox.style("opacity", 0);
        }

        _this.markerClickHandler = function(d){
            // marker events

            //call back if any listener is bind
            if(_this.markerClickCallback){
                _this.markerClickCallback(d);
            }
        }

        // getter setter section
        _this.datam = function(_value) {
            if(_value) this._data = _value;
            return this._data;
        };

        _this.topojson = function(_value) {
            if(_value) this._topojsonurl = _value;
            return this._topojsonurl;
        };

        _this.height = function(_value){
            if(_value) this._height = _value;
            return this._height;
        }

        _this.width = function(_value){
            if(_value) this._width = _value;
            return this._width;
        }

        return _this;
    }
    
   
