(function() {
  var __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  $(document).ready(function() {
    var Node, add_article, add_coulomb_repulsion, add_edge, add_hooke_attraction, create_button, create_node, end_move, force_graph_iter, gen_add_edges, gen_click, gen_move, gen_select_node, gen_start_move, paper, path_str, remove_edge, remove_node, root, search_node;
    root = typeof exports !== "undefined" && exports !== null ? exports : this;
    Array.prototype.remove = function(e) {
      var t, _ref;
      if ((t = this.indexOf(e)) > -1) {
        return ([].splice.apply(this, [t, t - t + 1].concat(_ref = [])), _ref);
      }
    };
    $(document).keyup(function(e) {
      if (e.which === 80) {
        root.mode = 'add edge';
      } else if (e.which === 81) {
        root.mode = 'remove edge';
      } else if (e.which === 82) {
        root.mode = 'remove node';
      } else if (e.which === 83) {
        root.mode = 'search';
      } else if (e.which === 84) {
        root.mode = 'graph';
      } else if (e.which === 85) {
        root.mode = 'center';
      } else {
        root.mode = '';
      }
      return $('#mode').val(root.mode);
    });
    Node = (function() {

      function Node(value, x, y) {
        this.value = value != null ? value : 'New Node';
        this.x = x != null ? x : root.w / 2;
        this.y = y != null ? y : root.h / 2;
        this.parents = [];
        this.children = [];
        this.circle = paper.circle(this.x, this.y, 10).attr({
          fill: 'white',
          cursor: 'pointer'
        });
        this.text = paper.text(this.x, this.y + 17, this.value).attr({
          cursor: 'pointer'
        });
        this.circle.drag(gen_move(this), gen_start_move(this), end_move);
        this.text.drag(gen_move(this), gen_start_move(this), end_move);
        this.circle.dblclick(gen_select_node(this));
        this.text.dblclick(gen_select_node(this));
        this.circle.click(gen_click(this));
        this.text.click(gen_click(this));
        this.paths_out = [];
        this.paths_in = [];
        this.vx = 0;
        this.vy = 0;
        this.traversed = true;
      }

      return Node;

    })();
    gen_move = function(node) {
      var circ, text;
      circ = node.circle;
      text = node.text;
      return function(dx, dy) {
        var i, path, _i, _j, _len, _len2, _ref, _ref2, _results;
        node.x = circ.ox + dx;
        node.y = circ.oy + dy;
        circ.attr({
          cx: circ.ox + dx,
          cy: circ.oy + dy
        });
        text.attr({
          x: text.ox + dx,
          y: text.oy + dy
        });
        i = 0;
        _ref = node.paths_out;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          path = _ref[_i];
          path.attr({
            path: path_str(node, node.children[i])
          });
          i++;
        }
        i = 0;
        _ref2 = node.paths_in;
        _results = [];
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          path = _ref2[_j];
          path.attr({
            path: path_str(node.parents[i], node)
          });
          _results.push(i++);
        }
        return _results;
      };
    };
    gen_start_move = function(node) {
      var circ, text;
      circ = node.circle;
      text = node.text;
      return function(x, y) {
        circ.ox = circ.attr('cx');
        circ.oy = circ.attr('cy');
        text.ox = text.attr('x');
        text.oy = text.attr('y');
        return root.moving = node;
      };
    };
    end_move = function() {
      return root.moving = null;
    };
    gen_click = function(dest) {
      return function() {
        var node, value, _ref;
        if (root.mode === 'add edge' && (root.selected != null)) {
          return add_edge(root.selected, dest);
        } else if (root.mode === 'remove edge' && (root.selected != null)) {
          return remove_edge(root.selected, dest);
        } else if (root.mode === 'remove node' && (root.selected != null)) {
          if (root.selected === dest) return remove_node(root.selected);
        } else if (root.mode === 'search' && (root.selected != null)) {
          if (root.selected === dest) return search_node(root.selected);
        } else if (root.mode === 'graph' && (root.selected != null)) {
          if (root.selected === dest) {
            if (root.graphing != null) {
              clearInterval(root.graphing);
              return root.graphing = null;
            } else {
              return root.graphing = setInterval(force_graph_iter, 10);
            }
          }
        } else if (root.mode === 'center' && (root.selected != null)) {
          if (root.selected === dest) {
            _ref = root.nodes;
            for (value in _ref) {
              node = _ref[value];
              node.traversed = false;
            }
            return root.center = add_article(root.selected.value, 0);
          }
        }
      };
    };
    gen_select_node = function(node) {
      return function() {
        if (root.selected != null) {
          root.selected.circle.attr({
            fill: 'white'
          });
        }
        root.selected = node;
        root.selected.circle.attr({
          fill: 'red'
        });
        return $('#node_name').val(node.value);
      };
    };
    path_str = function(from_node, to_node) {
      var cos, d, nx0, nx1, ny0, ny1, r, sin, x0, x1, x2, x3, y0, y1, y2, y3;
      x0 = from_node.circle.attr('cx');
      y0 = from_node.circle.attr('cy');
      x1 = to_node.circle.attr('cx');
      y1 = to_node.circle.attr('cy');
      d = Math.sqrt(Math.pow(y1 - y0, 2) + Math.pow(x1 - x0, 2));
      r = from_node.circle.attr('r');
      cos = (x1 - x0) / d;
      sin = (y1 - y0) / d;
      nx0 = x0 + r * cos;
      ny0 = y0 + r * sin;
      nx1 = x1 - r * cos;
      ny1 = y1 - r * sin;
      x2 = nx1 - r * (cos - sin);
      y2 = ny1 - r * (sin + cos);
      x3 = nx1 - r * (cos + sin);
      y3 = ny1 - r * (sin - cos);
      return ['M', nx0, ny0, 'L', nx1, ny1, 'L', x2, y2, 'M', nx1, ny1, 'L', x3, y3].join(',');
    };
    $('#node_name').change(function() {
      if (root.selected != null) {
        root.selected.value = $('#node_name').val();
        return root.selected.text.attr({
          text: root.selected.value
        });
      }
    });
    create_node = function() {
      var n;
      n = new Node;
      return gen_select_node(n)();
    };
    add_article = function(article, depth, x, y) {
      var n, node, uniq_pos, value, _ref, _ref2;
      if (x == null) x = root.x;
      if (y == null) y = root.y;
      if (root.nodes[article] != null) {
        n = root.nodes[article];
        if (!n.traversed) {
          n.traversed = true;
          $.ajax('http://localhost:23000/children/' + article, {
            dataType: 'jsonp',
            success: gen_add_edges(n, depth)
          });
        }
        return n;
      } else {
        if (depth > 3) {
          _ref = root.nodes;
          for (value in _ref) {
            node = _ref[value];
            if (!node.traversed) remove_node(node);
          }
          return null;
        }
        x += 50 * (Math.random() - .5);
        y += 50 * (Math.random() - .5);
        uniq_pos = false;
        while (!uniq_pos) {
          uniq_pos = true;
          _ref2 = root.nodes;
          for (value in _ref2) {
            node = _ref2[value];
            if (x === node.x && y === node.y) {
              uniq_pos = false;
              x += .1;
              y += .1;
              break;
            }
          }
        }
        n = new Node(article, x, y);
        root.nodes[article] = n;
        $.ajax('http://localhost:23000/children/' + article, {
          dataType: 'jsonp',
          success: gen_add_edges(n, depth)
        });
        return n;
      }
    };
    gen_add_edges = function(source, depth) {
      return function(links) {
        var dest, i, link, _len;
        for (i = 0, _len = links.length; i < _len; i++) {
          link = links[i];
          if (!(i < 5)) continue;
          dest = add_article(link, depth + 1, source.x, source.y);
          add_edge(source, dest);
        }
        if (!(root.graphing != null)) {
          return root.graphing = setInterval(force_graph_iter, 10);
        }
      };
    };
    add_edge = function(source, dest) {
      var path;
      if ((dest != null) && source !== dest && __indexOf.call(source.children, dest) < 0) {
        source.children.push(dest);
        dest.parents.push(source);
        path = paper.path(path_str(source, dest));
        source.paths_out.push(path);
        return dest.paths_in.push(path);
      }
    };
    remove_edge = function(source, dest) {
      var dest_index, source_index;
      dest_index = source.children.indexOf(dest);
      if (dest_index >= 0) {
        source.children.splice(dest_index, 1);
        source.paths_out[dest_index].remove();
        source.paths_out.splice(dest_index, 1);
        source_index = dest.parents.indexOf(source);
        dest.parents.splice(source_index, 1);
        return dest.paths_in.splice(source_index, 1);
      }
    };
    remove_node = function(node) {
      while (node.children.length > 0) {
        remove_edge(node, node.children[0]);
      }
      while (node.parents.length > 0) {
        remove_edge(node.parents[0], node);
      }
      node.circle.remove();
      node.text.remove();
      return delete root.nodes[node.value];
    };
    search_node = function(node) {
      return window.open('http://en.wikipedia.org/wiki/' + node.value);
    };
    force_graph_iter = function() {
      var child, d, force, i, ke, node, other_node, other_value, parent, path, t, value, _i, _j, _len, _len2, _ref, _ref2, _ref3, _ref4, _ref5, _ref6, _results;
      t = .5;
      d = .5;
      ke = 0;
      _ref = root.nodes;
      for (value in _ref) {
        node = _ref[value];
        if (node === root.center || node === root.moving) continue;
        force = {
          x: 0,
          y: 0
        };
        _ref2 = root.nodes;
        for (other_value in _ref2) {
          other_node = _ref2[other_value];
          if ((other_node != null) && other_node !== node) {
            add_coulomb_repulsion(force, node, other_node);
          }
        }
        _ref3 = node.children;
        for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
          child = _ref3[_i];
          add_hooke_attraction(force, node, child);
        }
        _ref4 = node.parents;
        for (_j = 0, _len2 = _ref4.length; _j < _len2; _j++) {
          parent = _ref4[_j];
          add_hooke_attraction(force, node, parent);
        }
        node.vx = (node.vx + t * force.x) * d;
        node.vy = (node.vy + t * force.y) * d;
        node.x += t * node.vx;
        node.y += t * node.vy;
        ke += Math.pow(node.vx, 2) + Math.pow(node.vy, 2);
      }
      _ref5 = root.nodes;
      for (value in _ref5) {
        node = _ref5[value];
        node.circle.attr({
          cx: node.x,
          cy: node.y
        });
        node.text.attr({
          x: node.x,
          y: node.y + 17
        });
      }
      _ref6 = root.nodes;
      _results = [];
      for (value in _ref6) {
        node = _ref6[value];
        _results.push((function() {
          var _len3, _ref7, _results2;
          _ref7 = node.paths_out;
          _results2 = [];
          for (i = 0, _len3 = _ref7.length; i < _len3; i++) {
            path = _ref7[i];
            _results2.push(path.attr({
              path: path_str(node, node.children[i])
            }));
          }
          return _results2;
        })());
      }
      return _results;
    };
    add_coulomb_repulsion = function(f, n1, n2) {
      var d, ftot, fx, fy, k;
      k = 10000;
      d = Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2));
      ftot = k / Math.pow(d, 2);
      fx = ftot * (n2.x - n1.x) / d;
      fy = ftot * (n2.y - n1.y) / d;
      f.x -= fx;
      return f.y -= fy;
    };
    add_hooke_attraction = function(f, n1, n2) {
      var d, ftot, fx, fy, k, len;
      k = 1;
      len = 100;
      d = Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2));
      ftot = k * (d - len);
      fx = ftot * (n2.x - n1.x) / d;
      fy = ftot * (n2.y - n1.y) / d;
      f.x += fx;
      return f.y += fy;
    };
    root.w = 2500;
    root.h = 1200;
    paper = Raphael($('#canvas_container')[0], root.w, root.h);
    paper.rect(5, 5, 70, 20, 10);
    paper.text(40, 15, "New Node");
    create_button = paper.rect(5, 5, 70, 20, 10);
    create_button.attr({
      fill: 'white',
      opacity: 0,
      cursor: 'pointer'
    });
    create_button.node.onclick = create_node;
    root.selected = null;
    root.mode = '';
    root.x = root.w / 2;
    root.y = root.h / 2;
    root.nodes = {};
    root.graphing = null;
    root.moving = null;
    return root.center = add_article('DNA', 0);
  });

}).call(this);
