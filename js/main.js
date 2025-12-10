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
	//Current selected phrase data (for index selection)
	var selectedPhraseData = null;
	//Array to store players with scores
	var players = [];
	var playerScores = {};
	
	// Load phrases from JSON file
	function loadPhrases() {
		return $.getJSON('frasi.json')
			.done(function(data) {
				phrases = data.frasi;
				console.log('Loaded ' + phrases.length + ' phrases with hints from JSON');
				console.log('Available categories:', data.categorie);
			})
			.fail(function() {
				console.error('Could not load phrases JSON file');
				phrases = [
					{
						id: 1,
						categoria: 'Proverbi',
						suggerimento: 'Proverbio filosofico con 4 parole semplici',
						frase: 'La vita è un gioco'
					},
					{
						id: 2,
						categoria: 'Proverbi',
						suggerimento: 'Proverbio sui pigri - contiene animali marini',
						frase: 'Chi dorme non piglia pesci'
					},
					{
						id: 3,
						categoria: 'Proverbi',
						suggerimento: 'Proverbio sul tempo - preferire il ritardo',
						frase: 'Meglio tardi che mai'
					},
					{
						id: 4,
						categoria: 'Proverbi',
						suggerimento: 'Frase famosa su tempo e ricchezza',
						frase: 'Il tempo è denaro'
					},
					{
						id: 5,
						categoria: 'Proverbi',
						suggerimento: 'Proverbio sulla collaborazione e forza',
						frase: 'L\'unione fa la forza'
					}
				];
			});
	}
	
	// Get phrase by index from loaded phrases
	function getPhraseByIndex(index) {
		if (phrases.length === 0 || index < 1 || index > phrases.length) {
			return null;
		}
		var selectedPhrase = phrases[index - 1]; // Array is 0-based, but user input is 1-based
		return {
			id: selectedPhrase.id,
			categoria: selectedPhrase.categoria,
			hint: selectedPhrase.suggerimento || 'Nessun suggerimento disponibile',
			phrase: selectedPhrase.frase
		};
	}
	function getRandomPhraseWithHint() {
		if (phrases.length === 0) {
			return {
				id: 1,
				categoria: 'Proverbi',
				hint: 'Proverbio filosofico con 4 parole semplici',
				phrase: 'La vita è un gioco'
			};
		}
		var randomIndex = Math.floor(Math.random() * phrases.length);
		var selectedPhrase = phrases[randomIndex];
		return {
			id: selectedPhrase.id,
			categoria: selectedPhrase.categoria,
			hint: selectedPhrase.suggerimento || 'Nessun suggerimento disponibile',
			phrase: selectedPhrase.frase
		};
	}
	
	// Initialize phrases loading
	loadPhrases();
	
	// Wheel of Fortune variables
	var wheelValues = [100, 200, 'PASSA', 200, 500, 'PASSA', 100, 200, 100, 'PASSA'];
	var wheelColors = ['#667eea', '#1abc9c', '#c0392b', '#1abc9c', '#ccc12eff', '#c0392b', '#667eea', '#1abc9c', '#667eea', '#c0392b'];
	var currentRotation = 0;
	var isSpinning = false;
	
	// Draw the wheel
	function drawWheel() {
		var canvas = document.getElementById('wheel-canvas');
		if (!canvas) return;
		
		var ctx = canvas.getContext('2d');
		var centerX = 175;
		var centerY = 175;
		var radius = 165;
		var sliceAngle = (2 * Math.PI) / wheelValues.length;
		
		ctx.clearRect(0, 0, 350, 350);
		ctx.save();
		ctx.translate(centerX, centerY);
		ctx.rotate(currentRotation);
		
		// Draw slices
		for (var i = 0; i < wheelValues.length; i++) {
			var startAngle = i * sliceAngle;
			var endAngle = startAngle + sliceAngle;
			
			// Draw slice
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.arc(0, 0, radius, startAngle, endAngle);
			ctx.closePath();
			ctx.fillStyle = wheelColors[i];
			ctx.fill();
			ctx.strokeStyle = '#ffffff';
			ctx.lineWidth = 3;
			ctx.stroke();
			
			// Draw text
			ctx.save();
			ctx.rotate(startAngle + sliceAngle / 2);
			ctx.textAlign = 'center';
			ctx.fillStyle = '#ffffff';
			ctx.font = 'bold 24px Arial';
			ctx.textBaseline = 'middle';
			ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
			ctx.shadowBlur = 3;
			ctx.shadowOffsetX = 1;
			ctx.shadowOffsetY = 1;
			ctx.fillText(wheelValues[i], radius * 0.7, 0);
			ctx.restore();
		}
		
		// Draw center circle
		ctx.beginPath();
		ctx.arc(0, 0, 20, 0, 2 * Math.PI);
		ctx.fillStyle = '#ffffff';
		ctx.fill();
		ctx.strokeStyle = '#667eea';
		ctx.lineWidth = 3;
		ctx.stroke();
		
		ctx.restore();
	}
	
	// Spin the wheel
	function spinWheel() {
		if (isSpinning) return;
		
		isSpinning = true;
		$('#spin-button').prop('disabled', true);
		
		// Random rotation (5-8 full rotations plus random angle)
		var spins = 5 + Math.random() * 3;
		var extraRotation = Math.random() * 2 * Math.PI;
		var targetRotation = currentRotation + (spins * 2 * Math.PI) + extraRotation;
		
		var startTime = Date.now();
		var startRotation = currentRotation;
		var duration = 6000; // 6 seconds
		
		function animate() {
			var elapsed = Date.now() - startTime;
			var progress = Math.min(elapsed / duration, 1);
			
			// Easing function (ease-out cubic for smoother deceleration)
			var easeProgress = 1 - Math.pow(1 - progress, 4);
			
			currentRotation = startRotation + (targetRotation - startRotation) * easeProgress;
			drawWheel();
			
			if (progress < 1) {
				requestAnimationFrame(animate);
			} else {
				currentRotation = targetRotation % (2 * Math.PI);
				drawWheel();
				
				// Calculate result - the arrow points at the top (0 degrees)
				// We need to find which slice is at the top after rotation
				var sliceAngle = (2 * Math.PI) / wheelValues.length;
				
				// Normalize the rotation to 0-2π
				var normalizedRotation = currentRotation % (2 * Math.PI);
				if (normalizedRotation < 0) normalizedRotation += 2 * Math.PI;
				
				// The arrow points at top (π/2 from right in standard coordinates)
				// We need to add π/2 to align with top position and then negate for clockwise rotation
				var arrowPosition = (2 * Math.PI - normalizedRotation) % (2 * Math.PI);
				
				// Find which slice the arrow is pointing at
				// Add half slice angle to center the detection
				var adjustedPosition = (arrowPosition + sliceAngle / 2) % (2 * Math.PI);
				var winningIndex = Math.floor(adjustedPosition / sliceAngle) % wheelValues.length;
				var prize = wheelValues[winningIndex];
				
				setTimeout(function() {
					isSpinning = false;
					$('#spin-button').prop('disabled', false);
				}, 500);
			}
		}
		
		animate();
	}
	
	// Handle wheel button click
	$('#wheel-button').click(function() {
		$('#wheel-modal').modal('show');
		setTimeout(drawWheel, 100);
	});
	
	// Handle wheel modal events
	$('#wheel-modal').on('shown', function() {
		// Block keyboard input while wheel modal is open
		config = 1;
	});
	
	$('#wheel-modal').on('hidden', function() {
		// Restore keyboard input when wheel modal is closed
		if (currentPhrase !== '') {
			config = 0;
		}
	});
	
	// Handle spin button click
	$('#spin-button').click(function() {
		spinWheel();
	});
	
	// Function to update players list display
	function updatePlayersList() {
		var $list = $('.players-items');
		$list.empty();
		
		if (players.length > 0) {
			players.forEach(function(player, index) {
				var $item = $('<li style="padding: 8px 12px; margin-bottom: 5px; background: rgba(102, 126, 234, 0.1); border-radius: 5px; display: flex; justify-content: space-between; align-items: center;"></li>');
				$item.append('<span style="color: #333;">' + (index + 1) + '. ' + player + '</span>');
				
				var $removeBtn = $('<button style="background: transparent; color: #999; border: none; padding: 2px 8px; font-size: 16px; cursor: pointer; transition: color 0.2s ease;">×</button>');
				$removeBtn.hover(
					function() { $(this).css('color', '#333'); },
					function() { $(this).css('color', '#999'); }
				);
				$removeBtn.click(function() {
					var removedPlayer = players[index];
					players.splice(index, 1);
					delete playerScores[removedPlayer];
					updatePlayersList();
					updateGamePlayersList();
				});
				
				$item.append($removeBtn);
				$list.append($item);
			});
			$('#players-list').show();
		} else {
			$('#players-list').hide();
		}
		
		// Update also the game screen list
		updateGamePlayersList();
	}
	
	// Function to update players list in game screen
	function updateGamePlayersList() {
		var $gameList = $('.game-players-items');
		$gameList.empty();
		
		if (players.length > 0) {
			players.forEach(function(player, index) {
				// Initialize score if not exists
				if (typeof playerScores[player] === 'undefined') {
					playerScores[player] = 0;
				}
				
				var $item = $('<li style="padding: 5px 0; margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between;"></li>');
				
				var $nameDiv = $('<div style="display: flex; justify-content: space-between; align-items: center; flex: 1; margin-right: 10px;"></div>');
				
				var $name = $('<span style="color: #ffffff; font-size: 22px; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);"></span>');
				$name.text(player);
				
				var $score = $('<span style="color: #ffffff; font-size: 22px; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);"></span>');
				$score.text(playerScores[player]);
				
				$nameDiv.append($name);
				$nameDiv.append($score);
				
				var $buttons = $('<span style="white-space: nowrap;"></span>');
				
				var $minusBtn = $('<button style="background: rgba(255, 255, 255, 0.2); color: #ffffff; border: 2px solid rgba(255, 255, 255, 0.4); padding: 6px 14px; font-size: 16px; font-weight: bold; margin-left: 8px; border-radius: 8px; cursor: pointer; backdrop-filter: blur(5px); transition: all 0.3s ease; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);">−</button>');
				$minusBtn.hover(
					function() { $(this).css({'background': 'rgba(255, 255, 255, 0.3)', 'transform': 'scale(1.05)'}); },
					function() { $(this).css({'background': 'rgba(255, 255, 255, 0.2)', 'transform': 'scale(1)'}); }
				);
				$minusBtn.click(function() {
					playerScores[player] -= 100;
					updateGamePlayersList();
				});
				
				var $plusBtn = $('<button style="background: rgba(255, 255, 255, 0.2); color: #ffffff; border: 2px solid rgba(255, 255, 255, 0.4); padding: 6px 14px; font-size: 16px; font-weight: bold; margin-left: 8px; border-radius: 8px; cursor: pointer; backdrop-filter: blur(5px); transition: all 0.3s ease; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);">+</button>');
				$plusBtn.hover(
					function() { $(this).css({'background': 'rgba(255, 255, 255, 0.3)', 'transform': 'scale(1.05)'}); },
					function() { $(this).css({'background': 'rgba(255, 255, 255, 0.2)', 'transform': 'scale(1)'}); }
				);
				$plusBtn.click(function() {
					playerScores[player] += 100;
					updateGamePlayersList();
				});
				
				$buttons.append($minusBtn);
				$buttons.append($plusBtn);
				
				$item.append($nameDiv);
				$item.append($buttons);
				$gameList.append($item);
			});
		}
	}
	
	// Handle add player button
	$('.add-player').click(function() {
		var playerName = $('.user-name-input').val().trim();
		
		if (playerName !== '') {
			players.push(playerName);
			$('.user-name-input').val('');
			updatePlayersList();
			$('.user-name-input').focus();
		} else {
			alert('Per favore inserisci un nome!');
			$('.user-name-input').focus();
		}
	});
	
	// Handle Enter key in player name input
	$('.user-name-input').keypress(function(e) {
		if(e.which == 13) {
			$('.add-player').click();
		}
	});
	
	//On click on the play button
	$('.brand').click(function() {
		//Reset the textbox for the new phrase
		$('.parse-me').val('');
		$('.hint-input').val('');
		$('.index-input-field').val('');
		char_used = '';
		$('.char-used').text('Lettere giocate: ');
		selectedPhrase = '';
		selectedPhraseData = null;
		
		// Hide hint section when starting new game
		$('#hint-section').hide();
		
		// Reset modal state
		$('#custom-input').hide();
		$('#index-input').hide();
		$('#phrase-preview').hide();
		$('.go').hide();
		
		$('#phrase').modal('show');
		config = 1;
	});
	
	// Handle random phrase button
	$('.random-phrase').click(function() {
		var phraseData = getRandomPhraseWithHint();
		selectedPhrase = phraseData.phrase;
		$('#phrase').modal('hide');
		startGame(selectedPhrase, true, phraseData.hint, phraseData.categoria);
	});
	
	// Handle index phrase button
	$('.index-phrase').click(function() {
		$('#index-input').show();
		$('.go').show();
		$('.index-input-field').focus();
	});
	
	// Handle custom phrase button
	$('.custom-phrase').click(function() {
		$('#custom-input').show();
		$('.go').show();
		$('.parse-me').focus();
	});
	
	// Handle index input change for preview
	$('.index-input-field').on('input', function() {
		var index = parseInt($(this).val());
		if (index && index >= 1 && index <= phrases.length) {
			var phraseData = getPhraseByIndex(index);
			if (phraseData) {
				selectedPhraseData = phraseData;
				$('#preview-category').text('Categoria: ' + phraseData.categoria);
				$('#preview-hint').text('Suggerimento: ' + phraseData.hint);
				$('#phrase-preview').show();
			}
		} else {
			$('#phrase-preview').hide();
			selectedPhraseData = null;
		}
	});
	
	//Set the focus on the textbox
	$('#phrase').on('shown', function () {
		// Focus is now handled by the custom phrase button
	});
	
	//Handle Enter key in modal
	$('.parse-me, .hint-input, .index-input-field').keypress(function(e) {
		if(e.which == 13) {
			$('.go').click();
		}
	});
	
	$('.go').click(function() {
		// Check if we're using index selection
		if (selectedPhraseData) {
			selectedPhrase = selectedPhraseData.phrase;
			$('#phrase').modal('hide');
			startGame(selectedPhrase, false, selectedPhraseData.hint, selectedPhraseData.categoria + ' #' + selectedPhraseData.id);
			return;
		}
		
		// Check if we're using custom phrase
		var phrase = $('.parse-me').val().trim();
		var customHint = $('.hint-input').val().trim();
		
		if(phrase !== '') {
			selectedPhrase = phrase;
			var hintToShow = customHint || 'Frase personalizzata - usa la tua intuizione!';
			$('#phrase').modal('hide');
			startGame(selectedPhrase, false, hintToShow, 'Personalizzata');
			return;
		}
		
		// Check if we're using index but no preview (invalid index)
		var indexValue = $('.index-input-field').val().trim();
		if (indexValue !== '') {
			alert('Per favore inserisci un numero valido tra 1 e ' + phrases.length + '!');
			$('.index-input-field').focus();
			return;
		}
		
		alert('Per favore seleziona una modalità di gioco!');
	});
	
	// Function to start the game with a given phrase
	function startGame(phrase, isRandom, hint, categoria) {
		$('.tabbellone').html('');
		char_used = '';
		$('.char-used').text('Lettere giocate: ');
		game += 1;
		
		var gameType = isRandom ? ' 🎲' : ' ✏️';
		var categoryText = categoria ? ' (' + categoria + ')' : '';
		$('.game').text('Partita n. ' + game + gameType + categoryText);
		
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