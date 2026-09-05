// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import EqualParts from '../src/engines/EqualParts.svelte';
import EngineHost from '../src/ui/EngineHost.svelte';
import questions from '../content/questions/fraction-studio.json';
import type { EqualPartsQuestion } from '../src/contracts/question';
import { evaluate } from '../src/evaluation/evaluate';

const question = questions[0] as EqualPartsQuestion;
afterEach(cleanup);

describe('equal-parts manipulation', () => {
  it('allows alternate arrangements and requires an explicit check', async () => {
    const submit = vi.fn();
    const view = render(EqualParts,{question,onSubmit:submit,checkResponse:(r)=>evaluate(question,r)});
    const cells = [...view.container.querySelectorAll<HTMLButtonElement>('.parts button')];
    await fireEvent.click(cells[0]); await fireEvent.click(cells[2]);
    await fireEvent.click(view.getByRole('button',{name:/Teal/}));
    await fireEvent.click(cells[1]); await fireEvent.click(cells[3]);
    expect(submit).not.toHaveBeenCalled();
    await fireEvent.click(view.getByRole('button',{name:'Check my whole'}));
    expect(submit).toHaveBeenCalledWith({assignments:['gold','teal','gold','teal']});
  });
  it('restores partial work and supports undo without a drag gesture', async () => {
    const view = render(EqualParts,{question,onSubmit:vi.fn(),checkResponse:(r)=>evaluate(question,r),initialState:{assignments:['gold',null,null,null]}});
    const cells = [...view.container.querySelectorAll<HTMLButtonElement>('.parts button')];
    expect(cells[0].getAttribute('aria-label')).toBe('Part 1: Gold');
    await fireEvent.click(cells[1]);
    await fireEvent.click(view.getByRole('button',{name:'Undo'}));
    expect(cells[1].getAttribute('aria-label')).toBe('Part 2: empty');
  });
  it('routes exploration through the shared host without evaluating the response', async () => {
    const checkResponse = vi.fn((r:unknown)=>evaluate(question,r));
    const submit = vi.fn();
    const view = render(EngineHost,{question,onSubmit:submit,checkResponse,feedbackMode:'explore',soundEnabled:false});
    await fireEvent.click(view.getByRole('button',{name:'Look at my whole'}));
    expect(submit).toHaveBeenCalledWith({assignments:[null,null,null,null]});
    expect(checkResponse).not.toHaveBeenCalled();
  });
});
