$(document).ready(() ->
  root = exports ? @
  Array::remove = (e) -> @[t..t] = [] if (t = @indexOf(e)) > -1

  $(document).keyup((e) ->
    if e.which is 80
      root.mode = 'add edge'
    else if e.which is 81
      root.mode = 'remove edge'
    else if e.which is 82
      root.mode = 'remove node'
    else if e.which is 83
      root.mode = 'search'
    else if e.which is 84
      root.mode = 'graph'
    else if e.which is 85
      root.mode = 'center'
    else if e.which is 86
      root.mode = 'list children'
    else
      root.mode = ''
    $('#mode').val(root.mode)
  )

  class Node
    constructor: (@value = 'New Node', @x = root.w / 2, @y = root.h / 2) ->
      @parents = []
      @children = []
      @circle = paper.circle(@x, @y, 10).attr({fill: 'white', cursor: 'pointer'})
      @text = paper.text(@x, @y + 17, @value).attr({cursor: 'pointer'})
      @circle.drag(gen_move(@), gen_start_move(@), end_move)
      @text.drag(gen_move(@), gen_start_move(@), end_move)
      @circle.dblclick(gen_select_node(@))
      @text.dblclick(gen_select_node(@))
      @circle.click(gen_click(@))
      @text.click(gen_click(@))
      @paths_out = []
      @paths_in = []
      @vx = 0
      @vy = 0
      @traversed = true

  gen_move = (node) ->
    circ = node.circle
    text = node.text
    (dx, dy) ->
      node.x = circ.ox + dx
      node.y = circ.oy + dy
      circ.attr({cx: circ.ox + dx, cy: circ.oy + dy})
      text.attr({x: text.ox + dx, y: text.oy + dy})
      i = 0
      for path in node.paths_out
        path.attr({path: path_str(node, node.children[i])})
        i++
      i = 0
      for path in node.paths_in
        path.attr({path: path_str(node.parents[i], node)})
        i++

  gen_start_move = (node) ->
    circ = node.circle
    text = node.text
    (x, y) ->
      circ.ox = circ.attr('cx')
      circ.oy = circ.attr('cy')
      text.ox = text.attr('x')
      text.oy = text.attr('y')
      root.moving = node

  end_move = () ->
    root.moving = null

  gen_click = (dest) ->
    () ->
      if root.mode is 'add edge' and root.selected?
        add_edge(root.selected, dest)
      else if root.mode is 'remove edge' and root.selected?
        remove_edge(root.selected, dest)
      else if root.mode is 'remove node' and root.selected?
        if root.selected is dest
          remove_node(root.selected)
      else if root.mode is 'search' and root.selected?
        if root.selected is dest
          search_node(root.selected)
      else if root.mode is 'graph' and root.selected?
        if root.selected is dest
          if root.graphing?
            clearInterval root.graphing
            root.graphing = null
          else
            root.graphing = setInterval(force_graph_iter, 10)
      else if root.mode is 'center' and root.selected?
        if root.selected is dest
          for value, node of root.nodes
            node.traversed = false
          root.center = add_article(root.selected.value, 0)
      else if root.mode is 'list children' and root.selected?
        if root.selected is dest
          $.ajax 'http://localhost:23000/children/' + root.selected.value,
            dataType: 'jsonp',
            success: gen_list_children(root.selected)

  gen_select_node = (node) ->
    () ->
      if root.selected?
        root.selected.circle.attr({fill: 'white'})
      root.selected = node
      root.selected.circle.attr({fill: 'red'})
      $('#node_name').val(node.value)

  path_str = (from_node, to_node) ->
    x0 = from_node.circle.attr('cx')
    y0 = from_node.circle.attr('cy')
    x1 = to_node.circle.attr('cx')
    y1 = to_node.circle.attr('cy')
    d = Math.sqrt(Math.pow(y1-y0,2)+Math.pow(x1-x0,2))
    r = from_node.circle.attr('r')
    cos = (x1 - x0) / d
    sin = (y1 - y0) / d
    nx0 = x0 + r * cos
    ny0 = y0 + r * sin
    nx1 = x1 - r * cos
    ny1 = y1 - r * sin
    x2 = nx1 - r * (cos - sin)
    y2 = ny1 - r * (sin + cos)
    x3 = nx1 - r * (cos + sin)
    y3 = ny1 - r * (sin - cos)
    ['M', nx0, ny0, 'L', nx1, ny1, 'L', x2, y2,
      'M', nx1, ny1, 'L', x3, y3].join(',')

  $('#node_name').change(() ->
    if root.selected?
      root.selected.value = $('#node_name').val()
      root.selected.text.attr({text: root.selected.value})
  )

  create_node = () ->
    n = new Node
    gen_select_node(n)()

  gen_add_child = (source, article) ->
    () ->
      if root.nodes[article]?
        dest = root.nodes[article]
      else
        x = source.x + 50 * (Math.random() - .5)
        y = source.y + 50 * (Math.random() - .5)
        uniq_pos = false
        while not uniq_pos
          uniq_pos = true
          for value, node of root.nodes
            if x is node.x and y is node.y
              uniq_pos = false
              x += .1
              y += .1
              break
        dest = new Node(article, x, y)
        root.nodes[article] = dest
      add_edge(source, dest)

  add_article = (article, depth, x = root.x, y = root.y) ->
    if root.nodes[article]?
      n = root.nodes[article]
      if not n.traversed
        n.traversed = true
        $.ajax 'http://localhost:23000/children/' + article,
          dataType: 'jsonp',
          success: gen_add_edges(n, depth)
      n
    else
      if depth > 3
        for value, node of root.nodes
          if not node.traversed
            remove_node(node)
        return null
      x += 50 * (Math.random() - .5)
      y += 50 * (Math.random() - .5)
      uniq_pos = false
      while not uniq_pos
        uniq_pos = true
        for value, node of root.nodes
          if x is node.x and y is node.y
            uniq_pos = false
            x += .1
            y += .1
            break
      n = new Node(article, x, y)
      root.nodes[article] = n
      $.ajax 'http://localhost:23000/children/' + article,
        dataType: 'jsonp',
        success: gen_add_edges(n, depth)
      n

  gen_add_edges = (source, depth) ->
    (links) ->
      for link, i in links when i < 5
        dest = add_article(link, depth + 1, source.x, source.y)
        add_edge(source, dest)
      if not root.graphing?
        root.graphing = setInterval(force_graph_iter, 10)

  gen_list_children = (node) ->
    (links) ->
      root.cur_links.remove()
      root.cur_links.clear()
      for link, i in links
        text = paper.text(200, (i + 1) * 10, link).attr({cursor: 'pointer'})
        text.node.onclick = gen_add_child(node, link)
        root.cur_links.push text

  add_edge = (source, dest) ->
    if dest? and source isnt dest and dest not in source.children
      source.children.push dest
      dest.parents.push source
      path = paper.path(path_str(source, dest))
      source.paths_out.push path
      dest.paths_in.push path

  remove_edge = (source, dest) ->
    dest_index = source.children.indexOf(dest)
    if dest_index >= 0
      source.children.splice(dest_index, 1)
      source.paths_out[dest_index].remove()
      source.paths_out.splice(dest_index, 1)
      source_index = dest.parents.indexOf(source)
      dest.parents.splice(source_index, 1)
      dest.paths_in.splice(source_index, 1)

  remove_node = (node) ->
    while node.children.length > 0
      remove_edge(node, node.children[0])
    while node.parents.length > 0
      remove_edge(node.parents[0], node)
    node.circle.remove()
    node.text.remove()
    delete root.nodes[node.value]

  search_node = (node) ->
    window.open('http://en.wikipedia.org/wiki/' + node.value)

  force_graph_iter = () ->    
    t = .5
    d = .5
    ke = 0
    for value, node of root.nodes
      if node is root.center or node is root.moving
        continue
      force = {x: 0, y: 0}
      for other_value, other_node of root.nodes
        if other_node? and other_node isnt node
          add_coulomb_repulsion(force, node, other_node)
      for child in node.children
        add_hooke_attraction(force, node, child)
      for parent in node.parents
        add_hooke_attraction(force, node, parent)
      node.vx = (node.vx + t * force.x) * d
      node.vy = (node.vy + t * force.y) * d
      node.x += t * node.vx
      node.y += t * node.vy
      ke += (Math.pow(node.vx, 2) + Math.pow(node.vy, 2))
    for value, node of root.nodes
      node.circle.attr({cx: node.x, cy: node.y})
      node.text.attr({x: node.x, y: node.y + 17})
    for value, node of root.nodes
      for path, i in node.paths_out
        path.attr({path: path_str(node, node.children[i])})

  add_coulomb_repulsion = (f, n1, n2) ->
    k = 10000
    d = Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2))
    ftot = k / Math.pow(d, 2)
    fx = ftot * (n2.x - n1.x) / d
    fy = ftot * (n2.y - n1.y) / d
    f.x -= fx
    f.y -= fy

  add_hooke_attraction = (f, n1, n2) ->
    k = 1
    len = 100
    d = Math.sqrt(Math.pow(n2.x - n1.x, 2) + Math.pow(n2.y - n1.y, 2))
    ftot = k * (d - len)
    fx = ftot * (n2.x - n1.x) / d
    fy = ftot * (n2.y - n1.y) / d
    f.x += fx
    f.y += fy    

  root.w = 2500
  root.h = 1200
  paper = Raphael($('#canvas_container')[0], root.w, root.h)
  paper.rect(5, 5, 70, 20, 10)
  paper.text(40, 15, "New Node")
  create_button = paper.rect(5, 5, 70, 20, 10)
  create_button.attr({
    fill: 'white'
    opacity: 0,
    cursor: 'pointer'
  })
  create_button.node.onclick = create_node
  root.selected = null
  root.mode = ''
  root.x = root.w / 2
  root.y = root.h / 2
  root.nodes = {}
  root.graphing = null
  root.moving = null
  root.cur_links = paper.set()
  root.center = add_article('DNA', 0)
)
