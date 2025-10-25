$(document).ready(function() {
	//This var is for block the event for keypress while the player insert the phrase
	var config = 0;
	//Counter for game played
	var game = 0;
	//Var for save the char played
	var char_used = '';
	//Current phrase
	var currentPhrase = '';
	//Array to store phrases from file
	var phrases = [];
	//Current selected phrase
	var selectedPhrase = '';
	
	// Load phrases from file
	function loadPhrases() {
		return $.get('frasi.txt')
			.done(function(data) {
				phrases = data.split('\n').filter(function(line) {
					return line.trim() !== '';
				});
				console.log('Loaded ' + phrases.length + ' phrases with hints');
			})
			.fail(function() {
				console.error('Could not load phrases file');
				phrases = [
					'Proverbio filosofico con 4 parole semplici|La vita è un gioco',
					'Proverbio sui pigri - contiene animali marini|Chi dorme non piglia pesci',
					'Proverbio sul tempo - preferire il ritardo|Meglio tardi che mai',
					'Frase famosa su tempo e ricchezza|Il tempo è denaro',
					'Proverbio sulla collaborazione e forza|L\'unione fa la forza'
				];
			});
	}
	
	// Get random phrase and hint from loaded phrases
	function getRandomPhraseWithHint() {
		if (phrases.length === 0) {
			return {
				hint: 'Proverbio filosofico con 4 parole semplici',
				phrase: 'La vita è un gioco'
			};
		}
		var randomIndex = Math.floor(Math.random() * phrases.length);
		var line = phrases[randomIndex].trim();
		var parts = line.split('|');
		return {
			hint: parts[0] || 'Nessun suggerimento disponibile',
			phrase: parts[1] || line
		};
	}
	
	// Initialize phrases loading
	loadPhrases();
	
	//On click on the play button
	$('.new-phrase').click(function() {
		//Reset the textbox for the new phrase
		$('.parse-me').val('');
		char_used = '';
		$('.char-used').text('Lettere giocate: ');
		selectedPhrase = '';
		
		// Hide hint section when starting new game
		$('#hint-section').hide();
		
		// Reset modal state
		$('#custom-input').hide();
		$('.go').hide();
		
		$('#phrase').modal('show');
		config = 1;
	});
	
	// Handle random phrase button
	$('.random-phrase').click(function() {
		var phraseData = getRandomPhraseWithHint();
		selectedPhrase = phraseData.phrase;
		$('#phrase').modal('hide');
		startGame(selectedPhrase, true, phraseData.hint);
	});
	
	// Handle custom phrase button
	$('.custom-phrase').click(function() {
		$('#custom-input').show();
		$('.go').show();
		$('.parse-me').focus();
	});
	
	//Set the focus on the textbox
	$('#phrase').on('shown', function () {
		// Focus is now handled by the custom phrase button
	});
	
	//Handle Enter key in modal
	$('.parse-me').keypress(function(e) {
		if(e.which == 13) {
			$('.go').click();
		}
	});
	
	$('.go').click(function() {
		var phrase = $('.parse-me').val().trim();
		
		if(phrase === '') {
			alert('Per favore inserisci una frase!');
			$('.parse-me').focus();
			return;
		}
		
		selectedPhrase = phrase;
		$('#phrase').modal('hide');
		startGame(selectedPhrase, false, 'Frase personalizzata - usa la tua intuizione!');
	});
	
	// Function to start the game with a given phrase
	function startGame(phrase, isRandom, hint) {
		$('.tabbellone').html('');
		char_used = '';
		$('.char-used').text('Lettere giocate: ');
		game += 1;
		
		var gameType = isRandom ? ' 🎲' : ' ✏️';
		$('.game').text('Partita n. ' + game + gameType);
		
		// Show hint in the dedicated section
		if (hint) {
			$('#game-hint').text(hint);
			$('#hint-section').show();
		} else {
			$('#hint-section').hide();
		}
		
		currentPhrase = phrase.toLowerCase();
		phrase_ = phrase.replace(/'/g, "");
		
		// Split phrase into words to prevent word breaking
		var words = phrase_.split(' ');
		
		// Create the letter display word by word
		for (var w = 0; w < words.length; w++) {
			var word = words[w];
			
			// Create a wrapper div for each word to prevent breaking
			var wordDiv = $('<div class="word-container"></div>');
			
			// Process each character in the word
			for (var i = 0; i < word.length; i++) {
				var char = word[i].toLowerCase();
				if(char.match(/[a-zA-ZàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚäöüÄÖÜçÇñÑ]/)) {
					wordDiv.append('<span class="letter-' + char + ' uncheck" data-letter="' + char + '">_</span>');
				} else {
					// For punctuation marks, show them immediately
					wordDiv.append('<span class="punctuation">' + word[i] + '</span>');
				}
			}
			
			// Add the word to the game board
			$('.tabbellone').append(wordDiv);
			
			// Add space between words (except for the last word)
			if (w < words.length - 1) {
				$('.tabbellone').append('<div class="word-space"></div>');
			}
		}
		
		config = 0;
	}
	
	$(document).bind('keypress', function(e) {
		if (config == 0 && currentPhrase !== '') {
			var char = String.fromCharCode(e.charCode).toLowerCase();
			
			// Check if it's a valid letter
			if(!char.match(/[a-zA-ZàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚäöüÄÖÜçÇñÑ]/)) {
				return;
			}
			
			// Check if letter was already used
			if(char_used.indexOf(char) !== -1) {
				return;
			}
			
			//if there are still letters to reveal
			if ($(".uncheck").length > 0){
				var foundLetter = false;
				$('.letter-' + char).each(function() {
					if($(this).hasClass('uncheck')) {
						$(this).text(char.toUpperCase()).addClass('check').removeClass('uncheck');
						foundLetter = true;
					}
				});
				
				// Add letter to used letters
				char_used += (char_used === '' ? '' : ', ') + char.toUpperCase();
				$('.char-used').text('Lettere giocate: ' + char_used);
				
				// Check if game is won
				setTimeout(function() {
					if($('.uncheck').length === 0) {
						$('.game').text('Partita n. ' + game + ' - VINTA!');
					}
				}, 100);
			}
			
			e.preventDefault();
		}
	});
	
	// Add visual feedback for wrong letters
	$(document).bind('keypress', function(e) {
		if (config == 0 && currentPhrase !== '') {
			var char = String.fromCharCode(e.charCode).toLowerCase();
			if(char.match(/[a-zA-ZàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚäöüÄÖÜçÇñÑ]/) && char_used.indexOf(char) === -1) {
				if($('.letter-' + char + '.uncheck').length === 0 && currentPhrase.indexOf(char) === -1) {
					// Letter not found - add visual feedback
					$('body').css('background', 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%)');
					setTimeout(function() {
						$('body').css('background', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
					}, 200);
				}
			}
		}
	});
});