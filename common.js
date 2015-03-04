var com;
com = com || {};
com.bns = com.bns || {};
com.bns.hr = com.bns.hr || {};

com.bns.hr.Common = {
	// Constants
	KEYBOARD: {
		TAB:      9,
		ENTER:    13,
		SPACE:    32,
		PAGEUP:   33,
		PAGEDOWN: 34,
		END:      35,
		HOME:     36,
		LEFT:     37,
		UP:       38,
		RIGHT:    39,
		DOWN:     40,
		ASTERISK: 106
	}, 
	
	// Functions
	generateGuid: function() {
		function s4() {
			return Math.floor( (1 + Math.random()) * 0x10000 )
				.toString(16)
				.substring(1);
		}
		
		return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
	}
}; 
