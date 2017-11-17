// Sorry, I did not have enough time to split the code on different components

import React, { Component } from 'react';
import {
    Platform,
    StyleSheet,
    Text,
    View,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Modal
} from 'react-native';

let waiter = null;

export default class App extends Component<{}> {
    constructor (props) {
        super(props);

        this.state = {
            repos: [],
            searchText: '',
            modalVisible: false,
            currentRepo: {},
            pulls: [],
            lastPullRequests: []
        };

        this.getRepositories = this._getRepositories.bind(this);
        this.handleInput = this._handleInput.bind(this);
        this.showRepoDetails = this._showRepoDetails.bind(this);
        this.setModalVisible = this._setModalVisible.bind(this);
        this.getPullRequests = this._getPullRequests.bind(this);
    }

    componentWillMount () {
        this.getRepositories();
    }

    _getRepositories (text) {
        let url = '';

        if(!text) {
            url = `https://api.github.com/search/repositories?q=stars:>=500&language:php&type=Repositories`;
        } else {
            url = `https://api.github.com/search/repositories?q=${text} in:name&type=Repositories`;
        }

        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/vnd.github.v3+json'
            }
        }).then((result) => {
            if (result.status !== 200) {
                throw new Error('Error');
            }

            return result.json();
        }).then(( result ) => {
            this.setState(() => ({
                repos: result.items
            }));
        }).catch((error) => {
            console.log(error.message);
        });
    }

    _getPullRequests (repo) {
        let url = repo.pulls_url.replace("{/number}", "");

        fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/vnd.github.v3+json'
            }
        }).then((result) => {
            if (result.status !== 200) {
                throw new Error('Error');
            }

            return result.json();
        }).then(( result ) => {
            this.setState(() => ({
                pulls: result
            }), () => {
                let lastPullRequests = this.state.pulls.slice(0, 10).map((pull, index) => {
                   return (
                       <Text style={styles.pullRequests}>
                           { pull.number } { pull.user.login } { pull.state }
                       </Text>
                   )
                });
                this.setState({ lastPullRequests });
            });
        }).catch((error) => {
            console.log(error.message);
        });
    }

    _handleInput (text) {
        this.setState(() => ({
            searchText: text
        }));

        clearTimeout(waiter);

        waiter = setTimeout(() => {
            if (this.state.searchText) {
                this.getRepositories(text);
            } else {
                this.getRepositories();
            }
        }, 1000);
    }

    _showRepoDetails (repo) {
        this.getPullRequests(repo);
        this.setState({currentRepo: repo});
        this.setModalVisible(!this.state.modalVisible)
    }

    _setModalVisible(visible) {
        this.setState({modalVisible: visible});
    }

    render() {
        const { repos, currentRepo } = this.state;
        const reposList = repos.map((repo, index) => {
            return (
                <TouchableOpacity onPress = {() => this.showRepoDetails(repo)}>
                    <View key={index} style = { index % 2 == 0 ? styles.repositoryWhite : styles.repositoryGray } >
                        <Text style={styles.repoName}>{ repo.name } </Text>
                        <View style={styles.repoDetails}>
                            <Text style={styles.repoContent}>● { !repo.language ? 'Unknown' : repo.language } </Text>
                            <Text style={styles.repoContent}>★{ Math.round(repo.stargazers_count/1000) }k </Text>
                            <Text style={styles.repoContent}>Watch: { repo.watchers } </Text>
                            <Text style={styles.repoContent}>Issues: { repo.open_issues } </Text>
                        </View>
                    </View>
                </TouchableOpacity>
            )
        });

        return (
            <View style={styles.container}>
                <Modal
                        animationType="slide"
                        transparent={false}
                        visible={this.state.modalVisible}
                >
                    <View style={{marginTop: 22}}>
                        <View style = { styles.modalContainer }>
                            <Text>Last 10 pull requests</Text>

                            { this.state.lastPullRequests }

                            <TouchableOpacity onPress={() => {
                                this.setModalVisible(!this.state.modalVisible)
                            }} style={styles.closeModalButton}>
                                <Text>Hide Modal</Text>
                            </TouchableOpacity>

                        </View>
                    </View>
                </Modal>
                <View style={styles.searchBar}>
                    <TextInput
                            style={styles.searchInput}
                            onChangeText={(text) => this.handleInput(text)}
                            value={this.state.searchText}
                            placeholder='Search for repository'
                    />
                </View>
                <ScrollView>
                    <View>
                        { reposList }
                    </View>
                </ScrollView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: 30
    },
    repositoryGray: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: '#ccc',
        height: 60,
        padding: 5
    },
    repositoryWhite: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: '#eee',
        height: 60,
        padding: 5
    },
    repoName: {
        flex: 1,
        color: 'blue'
    },
    repoDetails: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
    },
    yellowCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'yellow',
        backgroundColor: 'yellow'
    },
    repoContent: {
        fontSize: 12,
        color: '#555555'
    },
    searchBar: {
        alignItems: 'center',
        height: 50,
        borderColor: 'white'
    },
    searchInput: {
        width: 300,
        height: 35,
        borderColor: '#aaa',
        backgroundColor: '#eee',
        borderWidth: 1,
        borderRadius: 4,
        padding: 5
    },
    modalContainer: {
        flex: 1,
        padding: 10,
        alignItems: 'center'
    },
    closeModalButton: {
        width: 100,
        height: 40,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center'
    },
    pullRequests: {
        marginTop: 10
    }
});
