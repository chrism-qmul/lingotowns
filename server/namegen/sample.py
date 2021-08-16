# -*- coding: utf-8 -*-
from __future__ import unicode_literals, print_function, division
import torch
from namegen.model import RNN, categoryTensor, inputTensor, targetTensor
from namegen.data import all_letters, n_letters, category_lines, all_categories, n_categories

######################################################################
# Sampling the Network
# ====================
#
# To sample we give the network a letter and ask what the next one is,
# feed that in as the next letter, and repeat until the EOS token.
#
# -  Create tensors for input category, starting letter, and empty hidden
#    state
# -  Create a string ``output_name`` with the starting letter
# -  Up to a maximum output length,
#
#    -  Feed the current letter to the network
#    -  Get the next letter from highest output, and next hidden state
#    -  If the letter is EOS, stop here
#    -  If a regular letter, add to ``output_name`` and continue
#
# -  Return the final name
#
# .. Note::
#    Rather than having to give it a starting letter, another
#    strategy would have been to include a "start of string" token in
#    training and have the network choose its own starting letter.
#

rnn = torch.load("namegen/model.pt")
rnn.eval()

max_length = 20

# Sample from a category and starting letter
def sample(category, start_letter='A'):
    with torch.no_grad():  # no need to track history in sampling
        category_tensor = categoryTensor(category)
        input = inputTensor(start_letter)
        hidden = rnn.initHidden()

        output_name = start_letter

        for i in range(max_length):
            output, hidden = rnn(category_tensor, input[0], hidden)
            topv, topi = output.topk(1)
            topi = topi[0][0]
            if topi == n_letters - 1:
                break
            else:
                letter = all_letters[topi]
                output_name += letter
            input = inputTensor(letter)

        return output_name

# Get multiple samples from one category and multiple starting letters
def samples(category, start_letters='ABC'):
    for start_letter in start_letters:
        print(sample(category, start_letter))

if __name__ == "__main__":
    samples('Desert', 'M')
    samples('Lakes', 'D')
    samples('Forest', 'S')
