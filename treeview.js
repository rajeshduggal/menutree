var com;
com = com || {};
com.bns = com.bns || {};
com.bns.hr = com.bns.hr || {};

// Accessibility: Role and empty span hack is needed, or else ZoomText reader will announce "has submenu" on menuitems that don't have a submenu.

(function($) {
	$.fn.treeview = function(options) {
		var defaults = { 
			bgColor: "transparent",
			color: "white"
		};	
		var settings = $.extend( {}, defaults, options );
		
		return this.each(function() {
			var $this = $(this);
			return new com.bns.hr.Treeview( $this[0].id, settings );
		});
	};
})(jQuery);

com.bns.hr.Treeview = function(treeId, settings) {
	// Data Translator/Markup Generator
	generateHtml = function(jsonData) {
		if (!jsonData.items) return; // No list to render, abort
		
		// Create parent container
		var $container = $(document.createElement("div"));
		
		// Create heading, if supplied
		if (jsonData.header) {
			var headerId = controlId + "_header";
			var $heading = $(document.createElement("h2"))
				.attr("id", headerId)
				.html(jsonData.header)
			;
			$container.attr("aria-labelledby", headerId);
			$container.append($heading);
		}
		
		// Create root of treeview
		var $ulRoot = $(document.createElement("ul"))
			.attr({
				'id': controlId,
				'class': "tree root-level", 
				'role': "menu"
			})
		;
	
		createTreeItems(jsonData.items, $ulRoot, true);
		$ulRoot.find("li").first().attr("tabindex", "0");
		$container.append( $ulRoot );
		$("#" + treeId).append( $container );
	};
	
	createTreeItems = function(list, $parent, visible) {
		// Create nodes
		var count = list.length;
		for (var i = 0; i < count; ++i) {
			var item = list[i];
			var $treeitem = $(document.createElement("li"))
				.attr({ 
					'role': "menuitem", 
					'tabindex': "-1" 
				})
			;
			
			var $content;
			if (item.l) { // generate link
				if (visible) {
					$content = $(document.createElement("a"))
						.attr("href", item.l)
						.attr("role", "presentation")
						.html(item.d + "<span style=\"display:none;\">&nbsp;</span>");
				} else {
					$content = $(document.createElement("a"))
						.attr("href", item.l)
						.attr("title",item.d)
						.attr("role", "presentation");
				} 
				if (item.t)	//NOTE: Should this always be set and default to the main frame???
					$content.attr("target", item.t);
			}
			else //must be a title only
				if (visible) {
					$content = $(document.createElement("span")).html(item.d + "<span style=\"display:none;\">&nbsp;</span>");
				} else {
					$content = $(document.createElement("span"))
						.attr('title',item.d)
						.attr('aria-hidden',true);
				}
				
			$treeitem.append( $content );
			
			if (item.c) {
				$treeitem.attr( {
					"class": "tree-parent",
					"aria-expanded": "false",
					"aria-haspopup": "true"});
				$treeitem.attr("aria-label",item.d);
				var $childList = $(document.createElement("ul")).attr("role", "menu");
				createTreeItems(item.c, $childList,false);
				$treeitem.append( $childList );
			}
			
			$parent.append( $treeitem );
		} // end loop
	};
	
	// Helper functions
	refreshVisibleItems = function() { 
		$visibleItems = $control.find("li:visible");
	};
	
	focusActiveItem = function() {
		thisObj.$items.removeClass("tree-focus").attr("tabindex", "-1");
		$activeItem.addClass("tree-focus").attr("tabindex", "0");
	};
	
	toggleGroup = function($elem, forceExpand) {
		var $group = $elem.children("ul");

		var collapse = !forceExpand && ($elem.attr("aria-expanded") == "true");
		$group.attr("aria-hidden", collapse ? "true" : "false");
		if (collapse === false) {
      $elem.attr("aria-expanded", true);
			$elem.children('ul').children('li').children('a').each(function() {
				$(this).html($(this).attr('title') + "<span style=\"display:none;\">&nbsp;</span>"); //copy the title attr to the html
			});
			$elem.children('ul').children('li').children('span').each(function() {
				$(this).html($(this).attr('title')); //copy the title attr to the html
				$(this).attr('aria-hidden','false'); //copy the title attr to the html
			});
    } else {
      $elem.attr("aria-expanded", false);
			$elem.children('ul').children('li').children('a').html(""); //remove the html from the childen
			$elem.children('ul').children('li').children('span')
				.attr('aria-hidden',true)
				.html(""); //remove the html from the childen
    }
		
		refreshVisibleItems();
		
		$activeItem = $elem;	// update the active item
		focusActiveItem();
	};

	// Event handlers
	attachEventHandlers = function() {
		thisObj.$items.focus(function(e) { return handleFocus($(this), e); });
		thisObj.$items.click(function(e) { return handleClick($(this), e); });
		thisObj.$items.keydown(function(e) { return handleKeyDown($(this), e); });

		// on document click, unset focus and active item
		$(document).click(function(e) {
			if ($activeItem != null) {
				$activeItem.removeClass("tree-focus");
				$activeItem = null;
			}

			return true;
		});

	};

	handleFocus = function($item, e) {
		if (!$activeItem) 
			$activeItem = $item;		
		focusActiveItem();
		
		return false;
	};
	
	handleClick = function($elem, e) {
		// if a parent item, expand/collapse the children
		if ($.inArray($elem[0], $parents) >= 0) {
			if ( $elem.find(">ul").is(":visible") && (e.clientY > $elem.find(">ul").offset().top) )	// Hit Test: Was the span for the LI clicked or the UL?
				return true;
				
			toggleGroup($elem);	
		}
		
		$activeItem = $elem;	// update the active item
		focusActiveItem();

		e.stopPropagation();
		return true;	// don't prevent standard click handling to allow links to work
	};

	handleKeyDown = function($item, e) {
		if ((e.altKey || e.ctrlKey) || (e.shiftKey && e.keyCode != kb.TAB)) 
			return true;	// do nothing on modifier keys

		var curNdx = $visibleItems.index($item);
		switch (e.keyCode) {
			case kb.TAB: {	// remove focus from treeview
				$item.removeClass("tree-focus");
				$activeItem = null;
				 
				return true;	// allow keypress event to bubble up
			}
			case kb.HOME: 	// jump to first item in tree
				$activeItem = $parents.first();
				$activeItem.focus();
				break;
			case kb.END: 	// jump to last visible item in tree
				$activeItem = $visibleItems.last();
				$activeItem.focus();
				break;
			case kb.ENTER:
			case kb.SPACE: 
        console.log("ENTER/SPACE!");
				if ($item.is(".tree-parent"))	// if parent, expand/collapse group
					toggleGroup($item);
				else {	// If immediate child of LI is a link, click it
					var $links = $item.children("a");
					if ($links && $links.length == 1) {
						try {
							$links[0].click();	// Safari in Windows fails on this click attempt in jQuery 1.10
						} 
						catch(err) {	// The below catch block code works in all tested browsers except IE8
							var evObj = document.createEvent("MouseEvents");
							evObj.initMouseEvent("click", true, true, window);
							$links[0].dispatchEvent(evObj);
						} 
					} 
				}
				break;
			case kb.LEFT: 
				// collapse the group
        if (! $item.parent().is(".root-level")) {
          $activeItem = $item.parent().parent();	
          $activeItem.focus();
          toggleGroup($activeItem);
        }
				break;
			case kb.RIGHT: 
				// if parent and collapsed, expand the group
				if ($item.is(".tree-parent") && $item.attr("aria-expanded") == "false") 
					toggleGroup($item);
				// move down to the first child item
				$activeItem = $item.children("ul").children("li").first();
				$activeItem.focus();
				break;
			case kb.UP: 	// Move up the treeitem list
        if ($activeItem.is(":first-child")) {
          $activeItem = $item.siblings("li:last");
					$activeItem.focus();
        } else {
					$activeItem = $visibleItems.eq(curNdx - 1);
					$activeItem.focus();
				}
				break;
			case kb.DOWN: 	// Move down the treeitem list
        if ($activeItem.is(":last-child")) {
          $activeItem = $item.siblings("li:first");
					$activeItem.focus();
        } else {
					$activeItem = $visibleItems.eq(curNdx + 1);
					$activeItem.focus();
				}
				break;
			case kb.ASTERISK: 	// Expand/collapse all groups
				$parents.each(function() { 
					toggleGroup($(this), true);
				});
				break;
		}

		// If a handled keypress, stop event from bubbling
		switch (e.keyCode) {
			case kb.HOME: 
			case kb.END: 
			case kb.ENTER:
			case kb.SPACE: 
			case kb.LEFT: 
			case kb.RIGHT: 
			case kb.UP: 
			case kb.DOWN: 
			case kb.ASTERISK: 
				e.stopPropagation();
				return false;
			default: 
				return true;
		}
	}; // end keydown handler
	
	// Init of control and generation of contents, if required
	var controlId = treeId;
	if (settings.data && $("#"+treeId).is("div")) {
		controlId += com.bns.hr.Common.generateGuid();
		generateHtml(settings.data);
	}
	
	// Protected properties
	var thisObj = this;
	var kb = com.bns.hr.Common.KEYBOARD;
	var $control = $("#" + controlId);
	var $parents = $control.find(".tree-parent"); 
	var $visibleItems = null; 
	var $activeItem = null;

	// Public properties
	this.$items = $control.find("li"); 

	// Initialize the treeview	
	$control.find("a").each(function() {	// set tabindex to -1 for all links so they aren't stopped on
		$(this).attr("tabindex", "-1");
	});
	$parents.each(function() { // set aria properties on all children properly
		$(this).children("ul").attr("aria-hidden", ($(this).attr("aria-expanded") == "false") ? "true" : "false");
	});
	refreshVisibleItems();
	attachEventHandlers();
}; 
