import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Video } from '../../base/media';
import { participantSelected } from '../../base/participants';

import { LargeVideoContainer } from './_';

/**
 * Large video React component.
 * @extends Component
 */
class LargeVideo extends Component {
    /**
     * @constructor
     * @param props
     */
    constructor(props) {
        super(props);

        this.state = {
            videoStream: null,
            activeParticipant: null
        }
    }

    /**
     * How we handle new component properties.
     * @inheritdoc
     * @param nextProps
     */
    componentWillReceiveProps(nextProps) {
        let activeParticipant = getActiveParticipant(nextProps);
        let videoStream = null;
        let videoTrack = null;

        if (activeParticipant) {
            // If current active active participant is local user and he is
            // dominant speaker and not focused, use previous video stream.
            if (activeParticipant.local &&
                activeParticipant.speaking &&
                !activeParticipant.focused &&
                this.state.videoStream) {
                videoStream = this.state.videoStream;
            } else {
                videoTrack = getVideoTrack(
                    activeParticipant, this.props.tracks);

                videoStream = videoTrack
                    ? videoTrack.getOriginalStream()
                    : this.state.videoStream;
            }
        }

        // If our active participant changed and we're going to show "camera" on
        // large video, dispatch respective event.
        if (activeParticipant &&
            videoTrack &&
            !activeParticipant.selected &&
            activeParticipant.videoType === "camera") {
            this.props.dispatch(participantSelected(activeParticipant.id));
        }

        this.setState({
            videoStream: videoStream,
            activeParticipant: activeParticipant
        });
    }

    /**
     * React component render method implementation.
     * @inhertidoc
     */
    render() {
        let videoStreamParticipant = getParticipantByVideoStream(
            this.state.videoStream,
            this.props.tracks,
            this.props.participants);

        // TODO: in future other stuff might be on large video.

        return (
            <LargeVideoContainer>
                {videoStreamParticipant &&
                videoStreamParticipant.videoStarted &&
                this.state.videoStream &&
                <Video
                    stream={this.state.videoStream}/>}
            </LargeVideoContainer>
        );
    }
}

/**
 * Returns active participant to show.
 * @param {Object} props
 * @returns {Participant|undefined}
 */
function getActiveParticipant(props) {
    // First get the focused participant.
    let activeParticipant = props.participants.find(p => p.focused);

    // If no participant is focused, get the dominant speaker.
    if (!activeParticipant) {
        activeParticipant = props.participants.find(p => p.speaking);
    }

    // If no participant is focused and no dominant speaker,
    // just get the last one participant.
    if (!activeParticipant) {
        activeParticipant = props.participants[props.participants.length - 1];
    }

    return activeParticipant;
}

/**
 * Returns participant corresponding to video stream.
 * @param {MediaStream} stream
 * @param {(JitsiLocalTrack|JitsiRemoteTrack)[]} tracks
 * @param {Object} participants
 * @returns {Object|undefined}
 */
function getParticipantByVideoStream(stream, tracks, participants) {
    if (!stream) {
        return;
    }

    let track = tracks.find(t => t.getOriginalStream() === stream);

    if (track) {
        if (track.isLocal()) {
            return participants.find(p => p.local);
        } else {
            return participants.find(p => p.id === track.getParticipantId());
        }
    }
}

/**
 * Returns video stream for a specified participant.
 * @param {Participant} participant
 * @param {(JitsiLocalTrack|JitsiRemoteTrack)[]} tracks
 * @returns {JitsiLocalTrack|JitsiRemoteTrack|undefined}
 */
function getVideoTrack(participant, tracks) {
    return tracks.find(t => {
        return t.isVideoTrack() &&
            ((participant.local && t.isLocal()) ||
            (!participant.local && !t.isLocal() &&
            t.getParticipantId() === participant.id));
    });
}

/**
 * Maps parts Redux state to Component's props.
 * @param state
 * @returns {{
 *      tracks: (JitsiLocalTrack|JitsiRemoteTrack)[],
 *      participants: Participant[]
 *  }}
 */
const mapStateToProps = state => {
    return {
        tracks: state['features/base/tracks'],
        participants: state['features/base/participants']
    };
};

export default connect(mapStateToProps)(LargeVideo);