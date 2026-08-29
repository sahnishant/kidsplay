<script lang="ts">
  import { getFreeAnimalsPackTitle, getFreeAnimalsQuestions } from './content';
  import Session from './ui/Session.svelte';

  const title = getFreeAnimalsPackTitle();
  const questions = getFreeAnimalsQuestions();
</script>

<Session {title} {questions} />
