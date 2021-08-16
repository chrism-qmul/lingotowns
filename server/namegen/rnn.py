# -*- coding: utf-8 -*-
"""
NLP From Scratch: Generating Names with a Character-Level RNN
*************************************************************
**Author**: `Sean Robertson <https://github.com/spro/practical-pytorch>`_
This is our second of three tutorials on "NLP From Scratch".
In the `first tutorial </intermediate/char_rnn_classification_tutorial>`
we used a RNN to classify names into their language of origin. This time
we'll turn around and generate names from languages.
::
    > python sample.py Russian RUS
    Rovakov
    Uantov
    Shavakov
    > python sample.py German GER
    Gerren
    Ereng
    Rosher
    > python sample.py Spanish SPA
    Salla
    Parer
    Allan
    > python sample.py Chinese CHI
    Chan
    Hang
    Iun
We are still hand-crafting a small RNN with a few linear layers. The big
difference is instead of predicting a category after reading in all the
letters of a name, we input a category and output one letter at a time.
Recurrently predicting characters to form language (this could also be
done with words or other higher order constructs) is often referred to
as a "language model".
**Recommended Reading:**
I assume you have at least installed PyTorch, know Python, and
understand Tensors:
-  https://pytorch.org/ For installation instructions
-  :doc:`/beginner/deep_learning_60min_blitz` to get started with PyTorch in general
-  :doc:`/beginner/pytorch_with_examples` for a wide and deep overview
-  :doc:`/beginner/former_torchies_tutorial` if you are former Lua Torch user
It would also be useful to know about RNNs and how they work:
-  `The Unreasonable Effectiveness of Recurrent Neural
   Networks <https://karpathy.github.io/2015/05/21/rnn-effectiveness/>`__
   shows a bunch of real life examples
-  `Understanding LSTM
   Networks <https://colah.github.io/posts/2015-08-Understanding-LSTMs/>`__
   is about LSTMs specifically but also informative about RNNs in
   general
I also suggest the previous tutorial, :doc:`/intermediate/char_rnn_classification_tutorial`
Preparing the Data
==================
.. Note::
   Download the data from
   `here <https://download.pytorch.org/tutorial/data.zip>`_
   and extract it to the current directory.
See the last tutorial for more detail of this process. In short, there
are a bunch of plain text files ``data/names/[Language].txt`` with a
name per line. We split lines into an array, convert Unicode to ASCII,
and end up with a dictionary ``{language: [names ...]}``.
"""
from __future__ import unicode_literals, print_function, division
from model import RNN, categoryTensor, inputTensor, targetTensor
from data import all_letters, n_letters, category_lines, all_categories, n_categories


######################################################################
# Exercises
# =========
#
# -  Try with a different dataset of category -> line, for example:
#
#    -  Fictional series -> Character name
#    -  Part of speech -> Word
#    -  Country -> City
#
# -  Use a "start of sentence" token so that sampling can be done without
#    choosing a start letter
# -  Get better results with a bigger and/or better shaped network
#
#    -  Try the nn.LSTM and nn.GRU layers
#    -  Combine multiple of these RNNs as a higher level network
#

